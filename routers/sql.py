import time
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status, Request
import sqlparse
import pymysql
import sqlite3
from db import get_db, query_all, get_engine, execute_write
from auth import get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/sql",
    tags=["SQL Studio"]
)

# Rolling window rate limiter: 30 queries per 60 seconds per user/IP
_query_timestamps = defaultdict(list)

def check_rate_limit(actor_key: Any, max_requests: int = 30, window_seconds: int = 60) -> None:
    now = time.time()
    timestamps = _query_timestamps[actor_key]
    _query_timestamps[actor_key] = [t for t in timestamps if now - t < window_seconds]
    if len(_query_timestamps[actor_key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: Maximum {max_requests} queries per {window_seconds} seconds allowed."
        )
    _query_timestamps[actor_key].append(now)

DISALLOWED_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "REPLACE",
    "CREATE", "GRANT", "REVOKE", "INTO", "OUTFILE", "DUMPFILE", "EXEC",
    "EXECUTE", "SET", "CALL", "RENAME", "ATTACH", "DETACH"
}

def validate_sql_readonly(query_str: str) -> None:
    """Use sqlparse AST parser to ensure statement is strictly a read-only SELECT."""
    parsed = [s for s in sqlparse.parse(query_str.strip()) if s.tokens and not s.is_whitespace]
    if not parsed:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
    if len(parsed) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security violation: Multiple SQL statements are strictly prohibited."
        )
    
    stmt = parsed[0]
    stmt_type = stmt.get_type().upper()
    if stmt_type != "SELECT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security violation: Only SELECT statements are permitted in SQL Studio. Received '{stmt_type}'."
        )

    # Check all flattened tokens for any mutation or dangerous commands
    for token in stmt.flatten():
        val = token.value.upper().strip()
        if val in DISALLOWED_KEYWORDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: Keyword '{val}' is forbidden in read-only SQL queries."
            )

class QueryRequest(BaseModel):
    query: str
    user_id: Optional[int] = None  # Deprecated: Derived strictly from auth token

PRESET_QUERIES = [
    {
        "id": "all-users-profiles",
        "title": "All Users with Profile & Status",
        "category": "Users & Identity",
        "sql": """SELECT 
    u.user_id, 
    u.username, 
    u.email, 
    u.bio, 
    u.account_status,
    pp.image_url AS avatar_url,
    ru.location,
    ru.interests,
    au.admin_level
FROM Users u
LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
LEFT JOIN Admin_User au ON au.user_id = u.user_id
ORDER BY u.user_id ASC;"""
    },
    {
        "id": "user-credentials-store",
        "title": "User Credentials & Password Database",
        "category": "Security & Auth",
        "sql": """SELECT 
    uc.credential_id,
    uc.user_id,
    uc.username,
    uc.password_hash,
    uc.account_role,
    uc.last_login,
    uc.created_at
FROM User_Credentials uc
ORDER BY uc.credential_id ASC;"""
    },
    {
        "id": "posts-engagement",
        "title": "Posts with Reaction & Comment Counts",
        "category": "Feed & Engagement",
        "sql": """SELECT 
    p.post_id,
    u.username AS author,
    p.content,
    p.created_date,
    COUNT(DISTINCT r.reaction_id) AS reaction_count,
    COUNT(DISTINCT c.comment_id) AS comment_count
FROM Post p
JOIN Users u ON u.user_id = p.user_id
LEFT JOIN Reaction r ON r.post_id = p.post_id
LEFT JOIN Comment c ON c.post_id = p.post_id
GROUP BY p.post_id, u.username, p.content, p.created_date
ORDER BY reaction_count DESC, p.created_date DESC;"""
    },
    {
        "id": "community-membership",
        "title": "Community Groups & Member Rosters",
        "category": "Communities",
        "sql": """SELECT 
    cg.group_id,
    cg.group_name,
    cg.privacy_setting,
    COUNT(gm.user_id) AS total_members,
    GROUP_CONCAT(u.username SEPARATOR ', ') AS member_usernames
FROM Community_Group cg
LEFT JOIN Group_Members gm ON gm.group_id = cg.group_id
LEFT JOIN Users u ON u.user_id = gm.user_id
GROUP BY cg.group_id, cg.group_name, cg.privacy_setting;"""
    },
    {
        "id": "trending-hashtags",
        "title": "Hashtags and Associated Post Count",
        "category": "Discovery",
        "sql": """SELECT 
    h.hashtag_id,
    h.tag,
    h.category,
    COUNT(ph.post_id) AS post_count
FROM Hashtag h
LEFT JOIN Post_Hashtag ph ON ph.hashtag_id = h.hashtag_id
GROUP BY h.hashtag_id, h.tag, h.category
ORDER BY post_count DESC;"""
    },
    {
        "id": "messages-inbox",
        "title": "Direct Messages Conversation History",
        "category": "Messaging",
        "sql": """SELECT 
    m.message_id,
    s.username AS sender,
    r.username AS recipient,
    m.content,
    m.sent_at,
    m.read_status
FROM Message m
JOIN Users s ON s.user_id = m.sender_id
JOIN Users r ON r.user_id = m.receiver_id
ORDER BY m.sent_at DESC;"""
    },
    {
        "id": "telemetry-audit",
        "title": "System Telemetry & Activity Logs",
        "category": "Analytics & Audit",
        "sql": """SELECT 
    ea.event_id,
    u.username,
    ea.event_type,
    ea.device_type,
    ea.metadata,
    ea.event_time
FROM Event_Analysis ea
JOIN Users u ON u.user_id = ea.user_id
ORDER BY ea.event_time DESC
LIMIT 50;"""
    },
    {
        "id": "friend-recommendations-matrix",
        "title": "Friend Compatibility Scores",
        "category": "Recommendations",
        "sql": """SELECT 
    u1.username AS user,
    u2.username AS recommended_user,
    fr.score,
    CONCAT(ROUND(fr.score * 100, 1), '%') AS compatibility_pct,
    fr.generated_at
FROM Friend_Recommendation fr
JOIN Users u1 ON u1.user_id = fr.user_id
JOIN Users u2 ON u2.user_id = fr.recommended_user_id
ORDER BY fr.score DESC;"""
    },
    {
        "id": "notifications-overview",
        "title": "Notifications by Recipient",
        "category": "Notifications",
        "sql": """SELECT 
    n.notification_id,
    u.username AS recipient,
    n.content,
    n.ref_type,
    n.ref_id,
    n.created_at
FROM Notification n
JOIN Users u ON u.user_id = n.recipient_id
ORDER BY n.created_at DESC;"""
    },
    {
        "id": "user-follows-graph",
        "title": "Social Follows & Graph Connections",
        "category": "Social Graph",
        "sql": """SELECT 
    uf.follow_id,
    f1.username AS follower,
    f2.username AS following,
    uf.created_at
FROM User_Follow uf
JOIN Users f1 ON f1.user_id = uf.follower_id
JOIN Users f2 ON f2.user_id = uf.following_id
ORDER BY uf.created_at DESC;"""
    }
]

@router.get("/presets")
def get_preset_queries(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    """Return curated sample queries for quick exploration. Accessible to everyone."""
    return {
        "success": True,
        "presets": PRESET_QUERIES
    }

@router.get("/schema")
def get_database_schema(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    """Return database schema information for all tables. Accessible to everyone."""
    try:
        engine = get_engine()
        if engine == "mysql":
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT TABLE_NAME AS tbl_name 
                        FROM information_schema.tables 
                        WHERE table_schema = DATABASE() 
                          AND table_type = 'BASE TABLE'
                        ORDER BY TABLE_NAME ASC
                    """)
                    tables = [row["tbl_name"] for row in cursor.fetchall()]

                    schema_info = []
                    for table_name in tables:
                        cursor.execute("""
                            SELECT 
                                ORDINAL_POSITION AS cid,
                                COLUMN_NAME AS col_name,
                                COLUMN_TYPE AS col_type,
                                (IS_NULLABLE = 'NO') AS notnull_flag,
                                COLUMN_DEFAULT AS dflt_value,
                                (COLUMN_KEY = 'PRI') AS pk_flag
                            FROM information_schema.columns
                            WHERE table_schema = DATABASE() AND table_name = %s
                            ORDER BY ORDINAL_POSITION ASC
                        """, (table_name,))
                        cols = cursor.fetchall()
                        
                        cursor.execute(f"SELECT COUNT(*) AS count FROM `{table_name}`")
                        row_count = cursor.fetchone()["count"]

                        schema_info.append({
                            "table_name": table_name,
                            "row_count": row_count,
                            "columns": [
                                {
                                    "cid": col["cid"],
                                    "name": col["col_name"],
                                    "type": col["col_type"],
                                    "notnull": bool(col["notnull_flag"]),
                                    "dflt_value": col["dflt_value"],
                                    "pk": bool(col["pk_flag"])
                                }
                                for col in cols
                            ]
                        })

                    return {
                        "success": True,
                        "table_count": len(schema_info),
                        "tables": schema_info
                    }
        else:
            # SQLite schema
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC")
                tables = [row[0] for row in cursor.fetchall()]

                schema_info = []
                for table_name in tables:
                    cursor.execute(f"PRAGMA table_info(`{table_name}`)")
                    cols = cursor.fetchall()

                    cursor.execute(f"SELECT COUNT(*) AS count FROM `{table_name}`")
                    row_count = cursor.fetchone()[0]

                    schema_info.append({
                        "table_name": table_name,
                        "row_count": row_count,
                        "columns": [
                            {
                                "cid": col[0],
                                "name": col[1],
                                "type": col[2],
                                "notnull": bool(col[3]),
                                "dflt_value": col[4],
                                "pk": bool(col[5])
                            }
                            for col in cols
                        ]
                    })

                return {
                    "success": True,
                    "table_count": len(schema_info),
                    "tables": schema_info
                }
    except Exception as e:
        logger.error(f"Error fetching schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
def execute_sql_query(
    payload: QueryRequest,
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """Execute raw read-only SELECT query against database. Accessible to everyone with AST read-only validation."""
    actor_key = current_user["user_id"] if current_user else (request.client.host if request.client else "anonymous")
    actor_name = current_user.get("username") if current_user else "anonymous"
    user_id = current_user["user_id"] if current_user else None
    check_rate_limit(actor_key)

    query_str = payload.query.strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")

    # Use AST parser to ensure statement is strictly a read-only SELECT
    validate_sql_readonly(query_str)

    start_time = time.perf_counter()
    engine = get_engine()

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(query_str)
            
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                raw_rows = cursor.fetchall()
                if engine == "mysql":
                    rows = list(raw_rows) if raw_rows else []
                else:
                    rows = [dict(r) for r in raw_rows] if raw_rows else []
                
                elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

                # Audit log every query with acting user's identity
                try:
                    execute_write("""
                        INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
                        VALUES (?, 'SQL_STUDIO_EXECUTE', 'WEB', ?)
                    """, (user_id, json.dumps({
                        "user": actor_name,
                        "query": query_str[:500],
                        "rows_count": len(rows),
                        "execution_time_ms": elapsed_ms,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })))
                except Exception as audit_err:
                    logger.warning(f"Failed to log SQL audit event: {audit_err}")

                return {
                    "success": True,
                    "query_type": "SELECT",
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "execution_time_ms": elapsed_ms,
                    "message": f"Query returned {len(rows)} row(s) in {elapsed_ms}ms"
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Query produced no result set. Only SELECT queries producing result sets are allowed."
                )
    except HTTPException:
        raise
    except (pymysql.MySQLError, sqlite3.Error) as dbe:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "success": False,
            "error": str(dbe),
            "execution_time_ms": elapsed_ms,
            "columns": [],
            "rows": [],
            "row_count": 0
        }
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "success": False,
            "error": str(e),
            "execution_time_ms": elapsed_ms,
            "columns": [],
            "rows": [],
            "row_count": 0
        }
