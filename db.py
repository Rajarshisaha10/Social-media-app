import os
import re
import logging
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

# Thread-safe MySQL Connection Pool
_pool = None

def get_pool() -> PooledDB:
    global _pool
    if _pool is None:
        # First ensure target database exists
        try:
            temp_conn = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                autocommit=True
            )
            with temp_conn.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            temp_conn.close()
        except Exception as e:
            logger.warning(f"Could not verify database creation: {e}")

        _pool = PooledDB(
            creator=pymysql,
            mincached=5,
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
    return _pool

@contextmanager
def get_db():
    """Context manager yielding a pooled MySQL connection."""
    pool = get_pool()
    conn = pool.connection()
    try:
        yield conn
    finally:
        conn.close()

def _adapt_sql(sql: str) -> str:
    """Adapt SQLite syntax quirks to MySQL."""
    # Convert SQLite 'INSERT OR IGNORE' -> MySQL 'INSERT IGNORE'
    sql = re.sub(r'INSERT\s+OR\s+IGNORE\s+INTO', 'INSERT IGNORE INTO', sql, flags=re.IGNORECASE)
    # Convert SQLite 'INSERT OR REPLACE' -> MySQL 'REPLACE INTO'
    sql = re.sub(r'INSERT\s+OR\s+REPLACE\s+INTO', 'REPLACE INTO', sql, flags=re.IGNORECASE)
    # Convert '?' placeholder to '%s' for PyMySQL
    # PyMySQL expects '%s' while SQLite code uses '?'
    sql = sql.replace("?", "%s")
    return sql

def query_all(sql: str, params: tuple | list = ()):
    """Execute a query and return all matching rows as a list of dicts."""
    adapted_sql = _adapt_sql(sql)
    with get_db() as conn:
        with conn.cursor() as cursor:
            if params:
                cursor.execute(adapted_sql, params)
            else:
                cursor.execute(adapted_sql)
            rows = cursor.fetchall()
            return list(rows) if rows else []

def query_one(sql: str, params: tuple | list = ()):
    """Execute a query and return a single row as a dict."""
    adapted_sql = _adapt_sql(sql)
    with get_db() as conn:
        with conn.cursor() as cursor:
            if params:
                cursor.execute(adapted_sql, params)
            else:
                cursor.execute(adapted_sql)
            row = cursor.fetchone()
            return dict(row) if row else None

def execute_write(sql: str, params: tuple | list = ()):
    """Execute an INSERT/UPDATE/DELETE query, commit, and return cursor.lastrowid."""
    adapted_sql = _adapt_sql(sql)
    with get_db() as conn:
        with conn.cursor() as cursor:
            if params:
                cursor.execute(adapted_sql, params)
            else:
                cursor.execute(adapted_sql)
            conn.commit()
            return cursor.lastrowid

def init_db():
    """Initialize all MySQL database tables and seed defaults if empty."""
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

    # Seed sample data if fresh
    user_count = query_one("SELECT COUNT(*) AS count FROM Users")
    if not user_count or user_count["count"] == 0:
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
    else:
        # Sync User_Credentials for existing users if any missing
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT IGNORE INTO User_Credentials (user_id, username, password_hash, account_role)
                    SELECT u.user_id, u.username, u.password, COALESCE(au.admin_level, 'USER')
                    FROM Users u
                    LEFT JOIN Admin_User au ON au.user_id = u.user_id
                """)
                
                # Ensure rajarshi super admin exists with dbms108
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
                
                # Seed follow rows if User_Follow is empty
                cursor.execute("SELECT COUNT(*) AS fcount FROM User_Follow")
                fcount = cursor.fetchone()["fcount"]
                if fcount == 0:
                    cursor.execute("""
                        INSERT IGNORE INTO User_Follow (follower_id, following_id) VALUES
                        (2, 3), (2, 4), (3, 2), (4, 2), (4, 3);
                    """)
            conn.commit()
