import os
import re
import logging
import sqlite3
from contextlib import contextmanager
from dotenv import load_dotenv
import pymysql
import pymysql.cursors
from dbutils.pooled_db import PooledDB

load_dotenv()

logger = logging.getLogger(__name__)

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "raju@123")
DB_NAME = os.getenv("DB_NAME", "social_media")

# Fallback: Parse DATABASE_URL if supplied by cloud platform
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    try:
        from urllib.parse import urlparse, unquote
        parsed = urlparse(DATABASE_URL)
        if parsed.hostname:
            DB_HOST = parsed.hostname
        if parsed.port:
            DB_PORT = parsed.port
        if parsed.username:
            DB_USER = unquote(parsed.username)
        if parsed.password:
            DB_PASSWORD = unquote(parsed.password)
        if parsed.path and len(parsed.path) > 1:
            DB_NAME = parsed.path.lstrip("/").split("?")[0]
    except Exception as e:
        logger.warning(f"Failed to parse DATABASE_URL: {e}")

SQLITE_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "social_media.db"))

# Engine state
_pool = None
DB_ENGINE = None

def get_engine() -> str:
    """Determine database engine: use MySQL if reachable, otherwise fall back to SQLite."""
    global DB_ENGINE, _pool
    if DB_ENGINE is not None:
        return DB_ENGINE

    if os.getenv("USE_SQLITE", "").lower() in ("true", "1", "yes"):
        DB_ENGINE = "sqlite"
        logger.info(f"Using SQLite database: {SQLITE_PATH}")
        return DB_ENGINE

    try:
        temp_conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=3,
            autocommit=True
        )
        with temp_conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        temp_conn.close()

        _pool = PooledDB(
            creator=pymysql,
            mincached=2,
            maxcached=20,
            maxshared=10,
            maxconnections=50,
            blocking=True,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        DB_ENGINE = "mysql"
        logger.info(f"Connected to MySQL on {DB_HOST}:{DB_PORT}/{DB_NAME}")
        return DB_ENGINE
    except Exception as err:
        logger.warning(
            f"MySQL connection failed ({DB_HOST}:{DB_PORT}): {err}. "
            f"Gracefully falling back to SQLite: {SQLITE_PATH}"
        )
        DB_ENGINE = "sqlite"
        return DB_ENGINE

@contextmanager
def get_db():
    """Context manager yielding a pooled MySQL connection or local SQLite connection."""
    engine = get_engine()
    if engine == "mysql":
        conn = _pool.connection()
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

def _adapt_sql(sql: str) -> str:
    """Adapt SQLite syntax quirks to MySQL."""
    sql = re.sub(r'INSERT\s+OR\s+IGNORE\s+INTO', 'INSERT IGNORE INTO', sql, flags=re.IGNORECASE)
    sql = re.sub(r'INSERT\s+OR\s+REPLACE\s+INTO', 'REPLACE INTO', sql, flags=re.IGNORECASE)
    sql = sql.replace("?", "%s")
    return sql

def _adapt_sqlite(sql: str) -> str:
    """Adapt MySQL syntax quirks to SQLite."""
    sql = re.sub(r'GROUP_CONCAT\((.*?)\s+SEPARATOR\s+(.*?)\)', r'GROUP_CONCAT(\1, \2)', sql, flags=re.IGNORECASE)
    sql = sql.replace("%s", "?")
    return sql

def query_all(sql: str, params: tuple | list = ()):
    """Execute a query and return all matching rows as a list of dicts."""
    engine = get_engine()
    if engine == "mysql":
        adapted_sql = _adapt_sql(sql)
        with get_db() as conn:
            with conn.cursor() as cursor:
                if params:
                    cursor.execute(adapted_sql, params)
                else:
                    cursor.execute(adapted_sql)
                rows = cursor.fetchall()
                return list(rows) if rows else []
    else:
        adapted_sql = _adapt_sqlite(sql)
        with get_db() as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(adapted_sql, params)
            else:
                cursor.execute(adapted_sql)
            rows = cursor.fetchall()
            return [dict(r) for r in rows] if rows else []

def query_one(sql: str, params: tuple | list = ()):
    """Execute a query and return a single row as a dict."""
    engine = get_engine()
    if engine == "mysql":
        adapted_sql = _adapt_sql(sql)
        with get_db() as conn:
            with conn.cursor() as cursor:
                if params:
                    cursor.execute(adapted_sql, params)
                else:
                    cursor.execute(adapted_sql)
                row = cursor.fetchone()
                return dict(row) if row else None
    else:
        with get_db() as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            row = cursor.fetchone()
            return dict(row) if row else None

def execute_write(sql: str, params: tuple | list = ()):
    """Execute an INSERT/UPDATE/DELETE query, commit, and return cursor.lastrowid."""
    engine = get_engine()
    if engine == "mysql":
        adapted_sql = _adapt_sql(sql)
        with get_db() as conn:
            with conn.cursor() as cursor:
                if params:
                    cursor.execute(adapted_sql, params)
                else:
                    cursor.execute(adapted_sql)
                conn.commit()
                return cursor.lastrowid
    else:
        with get_db() as conn:
            cursor = conn.cursor()
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            conn.commit()
            return cursor.lastrowid

def _seed_mysql_data():
    """Seed initial sample data for MySQL."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            # Users
            cursor.execute("""
                INSERT INTO Users (username, email, password, bio, account_status, dob) VALUES
                ('rajarshi', 'rajarshi@socialsphere.io', 'dbms108', 'Lead System Administrator & Database Architect', 'ACTIVE', '1998-05-20'),
                ('kandarp', 'kandarp@socialsphere.io', 'password123', 'Tech enthusiast & distributed systems researcher', 'ACTIVE', '1995-04-12'),
                ('Shobita', 'shobita@socialsphere.io', 'password123', 'Landscape photographer & creative tech writer', 'ACTIVE', '1992-08-25'),
                ('Aditi', 'aditi@socialsphere.io', 'password123', 'Fullstack engineer & open-source maintainer', 'ACTIVE', '1998-11-03'),
                ('admin_user', 'admin@socialapp.com', 'password123', 'Platform Operations Lead', 'ACTIVE', '1988-01-15');
            """)

            # User_Credentials table
            cursor.execute("""
                INSERT INTO User_Credentials (user_id, username, password_hash, account_role) VALUES
                (1, 'rajarshi', 'dbms108', 'SUPER_ADMIN'),
                (2, 'kandarp', 'password123', 'USER'),
                (3, 'Shobita', 'password123', 'USER'),
                (4, 'Aditi', 'password123', 'USER'),
                (5, 'admin_user', 'password123', 'OPS_ADMIN');
            """)

            # Regular & Admin Users
            cursor.execute("""
                INSERT INTO Admin_User (user_id, admin_level) VALUES
                (1, 'SUPER_ADMIN'),
                (5, 'OPS_ADMIN');
            """)
            cursor.execute("""
                INSERT INTO Regular_User (user_id, interests, location) VALUES
                (1, 'Databases, Distributed Systems, SQL, Architecture', 'Zurich, Switzerland'),
                (2, 'FastAPI, Python, Machine Learning', 'San Francisco, CA'),
                (3, 'Photography, Mountain Expeditions, Optics', 'Denver, CO'),
                (4, 'Web Architecture, PostgreSQL, MySQL, React', 'Seattle, WA'),
                (5, 'Infrastructure, Security, Telemetry', 'Boston, MA');
            """)

            # Profile Pics
            cursor.execute("""
                INSERT INTO Profile_Pic (user_id, image_url, pic_type) VALUES
                (1, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR'),
                (2, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'AVATAR'),
                (3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'AVATAR'),
                (4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'AVATAR'),
                (5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'AVATAR');
            """)

            # Posts
            cursor.execute("""
                INSERT INTO Post (user_id, content, url, visibility) VALUES
                (1, 'System update: MySQL 8 17-table relational schema successfully verified with full index optimization. #database #architecture #systems', NULL, 'PUBLIC'),
                (2, 'Excited to publish our new open source benchmarking suite for FastAPI and MySQL! #python #opensource', 'https://github.com/project', 'PUBLIC'),
                (3, 'High alpine sunrise capture from 12,000 feet elevation in the Rocky Mountains. #photography #nature', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'PUBLIC'),
                (4, 'FastAPI dependency injection makes testing multi-table relational flows effortless. #python #webdev', NULL, 'PUBLIC');
            """)

            # Comments
            cursor.execute("""
                INSERT INTO Comment (post_id, user_id, reply_to, content) VALUES
                (1, 2, NULL, 'Excellent work Rajarshi! The relational schema integrity is pristine.'),
                (1, 4, 1, 'Agreed! The foreign key cascades work flawlessly.'),
                (2, 3, NULL, 'Tested the benchmark on local node, great throughput numbers.');
            """)

            # Reactions
            cursor.execute("""
                INSERT INTO Reaction (post_id, user_id, reaction_type, comment_id) VALUES
                (1, 2, 'LIKE', NULL),
                (1, 3, 'LOVE', NULL),
                (1, 4, 'FIRE', NULL),
                (2, 1, 'LIKE', NULL),
                (3, 1, 'LOVE', NULL);
            """)

            # Community Groups & Members
            cursor.execute("""
                INSERT INTO Community_Group (group_name, description, privacy_setting) VALUES
                ('Database Architecture Circle', 'Deep dive into relational schemas, indexing, query optimization, and storage engines', 'PUBLIC'),
                ('Python Systems & Performance', 'High throughput microservices, asynchronous Python, and API design', 'PUBLIC'),
                ('Landscape Photography Collective', 'Camera optics, field workflows, and high dynamic range composition', 'PUBLIC');
            """)

            cursor.execute("""
                INSERT INTO Group_Members (group_id, user_id, role) VALUES
                (1, 1, 'ADMIN'),
                (1, 2, 'MEMBER'),
                (1, 4, 'MEMBER'),
                (2, 2, 'ADMIN'),
                (2, 1, 'MEMBER'),
                (3, 3, 'ADMIN'),
                (3, 1, 'MEMBER');
            """)

            # Hashtags & Post_Hashtag
            cursor.execute("""
                INSERT INTO Hashtag (tag, category) VALUES
                ('database', 'Systems'),
                ('architecture', 'Engineering'),
                ('systems', 'Infrastructure'),
                ('python', 'Programming'),
                ('opensource', 'Software'),
                ('photography', 'Art'),
                ('nature', 'Travel'),
                ('webdev', 'Development');
            """)

            cursor.execute("""
                INSERT INTO Post_Hashtag (post_id, hashtag_id) VALUES
                (1, 1), (1, 2), (1, 3),
                (2, 4), (2, 5),
                (3, 6), (3, 7),
                (4, 4), (4, 8);
            """)

            # Messages
            cursor.execute("""
                INSERT INTO Message (sender_id, receiver_id, content, read_status) VALUES
                (1, 2, 'Hello Alice, the new query telemetry tables are fully synchronized.', 'READ'),
                (2, 1, 'Confirmed, latency logs are showing sub-2ms response times.', 'READ'),
                (3, 1, 'Shared the high-resolution RAW captures in the photography archive.', 'UNREAD');
            """)

            # Notifications
            cursor.execute("""
                INSERT INTO Notification (recipient_id, content, ref_id, ref_type) VALUES
                (1, 'Alice liked your database architecture update.', 1, 'POST'),
                (1, 'Charlie commented on your post.', 1, 'COMMENT'),
                (2, 'Rajarshi verified your system benchmark.', 2, 'POST');
            """)

            # Friend Recommendations
            cursor.execute("""
                INSERT INTO Friend_Recommendation (user_id, recommended_user_id, score) VALUES
                (1, 2, 0.98),
                (1, 4, 0.94),
                (1, 3, 0.82),
                (2, 4, 0.91);
            """)

            # Event Analysis
            cursor.execute("""
                INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata) VALUES
                (1, 'LOGIN', 'WORKSTATION', '{"user": "rajarshi", "role": "SUPER_ADMIN", "auth": "SUCCESS"}'),
                (1, 'SCHEMA_VERIFY', 'WORKSTATION', '{"tables": 17, "integrity": "OK"}'),
                (2, 'POST_CREATE', 'WEB', '{"post_id": 2, "topic": "benchmark"}'),
                (3, 'REACT_POST', 'MOBILE', '{"post_id": 1, "reaction": "LOVE"}');
            """)

            # User_Follow (Social Follows)
            cursor.execute("""
                INSERT INTO User_Follow (follower_id, following_id) VALUES
                (2, 3),
                (2, 4),
                (3, 2),
                (4, 2),
                (4, 3);
            """)
        conn.commit()

def _sync_mysql_admin():
    """Ensure superadmin credentials exist in MySQL."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT IGNORE INTO User_Credentials (user_id, username, password_hash, account_role)
                SELECT u.user_id, u.username, u.password, COALESCE(au.admin_level, 'USER')
                FROM Users u
                LEFT JOIN Admin_User au ON au.user_id = u.user_id
            """)
            
            cursor.execute("SELECT user_id FROM Users WHERE username = 'rajarshi'")
            rajarshi = cursor.fetchone()
            if not rajarshi:
                cursor.execute("SELECT user_id FROM Users WHERE email = 'rajarshi@socialsphere.io'")
                email_match = cursor.fetchone()
                if email_match:
                    cursor.execute("UPDATE Users SET username = 'rajarshi', password = 'dbms108' WHERE user_id = %s", (email_match["user_id"],))
                    uid = email_match["user_id"]
                else:
                    cursor.execute("""
                        INSERT INTO Users (username, email, password, bio, account_status, dob)
                        VALUES ('rajarshi', 'rajarshi@socialsphere.io', 'dbms108', 'Lead System Administrator & Database Architect', 'ACTIVE', '1998-05-20')
                    """)
                    uid = cursor.lastrowid
                cursor.execute("REPLACE INTO Admin_User (user_id, admin_level) VALUES (%s, 'SUPER_ADMIN')", (uid,))
                cursor.execute("REPLACE INTO Profile_Pic (user_id, image_url, pic_type) VALUES (%s, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR')", (uid,))
                cursor.execute("REPLACE INTO Regular_User (user_id, interests, location) VALUES (%s, 'Databases, Distributed Systems, SQL, Architecture', 'Zurich, Switzerland')", (uid,))
                cursor.execute("REPLACE INTO User_Credentials (user_id, username, password_hash, account_role) VALUES (%s, 'rajarshi', 'dbms108', 'SUPER_ADMIN')", (uid,))
            else:
                cursor.execute("UPDATE Users SET password = 'dbms108' WHERE username = 'rajarshi'")
                cursor.execute("UPDATE User_Credentials SET password_hash = 'dbms108' WHERE username = 'rajarshi'")
            
            cursor.execute("SELECT COUNT(*) AS fcount FROM User_Follow")
            fcount = cursor.fetchone()["fcount"]
            if fcount == 0:
                cursor.execute("""
                    INSERT IGNORE INTO User_Follow (follower_id, following_id) VALUES
                    (2, 3), (2, 4), (3, 2), (4, 2), (4, 3);
                """)
        conn.commit()

def init_db():
    """Initialize database tables and seed defaults if empty."""
    engine = get_engine()
    if engine == "mysql":
        schema_file = os.path.join(os.path.dirname(__file__), "schema_mysql.sql")
        if os.path.exists(schema_file):
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
                    with open(schema_file, "r", encoding="utf-8") as f:
                        statements = f.read().split(";")
                        for stmt in statements:
                            cleaned = stmt.strip()
                            lines = [l for l in cleaned.splitlines() if not l.strip().startswith("--")]
                            stmt_no_comments = "\n".join(lines).strip()
                            if stmt_no_comments:
                                cursor.execute(stmt_no_comments)
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
                conn.commit()

        user_count = query_one("SELECT COUNT(*) AS count FROM Users")
        if not user_count or user_count["count"] == 0:
            _seed_mysql_data()
        else:
            _sync_mysql_admin()
    else:
        # SQLite initialization
        schema_file = os.path.join(os.path.dirname(__file__), "schema_sqlite.sql")
        try:
            user_count = query_one("SELECT COUNT(*) AS count FROM Users")
        except Exception:
            user_count = None

        if not user_count and os.path.exists(schema_file):
            with get_db() as conn:
                with open(schema_file, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
                conn.commit()
            logger.info("Initialized SQLite database from schema_sqlite.sql")
