import os
import sqlite3
import logging
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DB_PATH = os.getenv("DB_PATH", "social_media.db")

@contextmanager
def get_db():
    """Context manager for obtaining a SQLite connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()

def query_all(sql: str, params: tuple | list = ()):
    """Execute a query and return all matching rows as a list of dicts."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def query_one(sql: str, params: tuple | list = ()):
    """Execute a query and return a single row as a dict."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def execute_write(sql: str, params: tuple | list = ()):
    """Execute an INSERT/UPDATE/DELETE query and return the lastrowid."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
        return cursor.lastrowid

def init_db():
    """Initialize all SQLite database tables exactly according to schema specification."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.executescript("""
            -- 1. Users table
            CREATE TABLE IF NOT EXISTS Users (
                user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username       TEXT NOT NULL UNIQUE,
                email          TEXT NOT NULL UNIQUE,
                password       TEXT NOT NULL,
                bio            TEXT,
                account_status TEXT DEFAULT 'ACTIVE',
                dob            TEXT
            );

            -- 2. User_Credentials table (Dedicated Authentication & Password Store)
            CREATE TABLE IF NOT EXISTS User_Credentials (
                credential_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       INTEGER NOT NULL UNIQUE,
                username      TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                account_role  TEXT DEFAULT 'USER',
                last_login    DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_cred_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 3. Profile_Pic table
            CREATE TABLE IF NOT EXISTS Profile_Pic (
                profile_pic_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL,
                image_url      TEXT NOT NULL,
                pic_type       TEXT DEFAULT 'AVATAR',
                CONSTRAINT fk_profile_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 4. Regular_User table
            CREATE TABLE IF NOT EXISTS Regular_User (
                user_id   INTEGER PRIMARY KEY,
                interests TEXT,
                location  TEXT,
                CONSTRAINT fk_regular_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 5. Admin_User table
            CREATE TABLE IF NOT EXISTS Admin_User (
                user_id     INTEGER PRIMARY KEY,
                admin_level TEXT NOT NULL,
                CONSTRAINT fk_admin_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 6. Post table
            CREATE TABLE IF NOT EXISTS Post (
                post_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      INTEGER NOT NULL,
                content      TEXT,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                url          TEXT,
                visibility   TEXT DEFAULT 'PUBLIC',
                CONSTRAINT fk_post_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 7. Comment table
            CREATE TABLE IF NOT EXISTS Comment (
                comment_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id      INTEGER NOT NULL,
                user_id      INTEGER NOT NULL,
                reply_to     INTEGER,
                content      TEXT,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_comment_post
                    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_reply
                    FOREIGN KEY (reply_to) REFERENCES Comment(comment_id) ON DELETE CASCADE
            );

            -- 8. Reaction table
            CREATE TABLE IF NOT EXISTS Reaction (
                reaction_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id       INTEGER NOT NULL,
                user_id       INTEGER NOT NULL,
                reaction_type TEXT NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                comment_id    INTEGER,
                CONSTRAINT fk_reaction_post
                    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
                CONSTRAINT fk_reaction_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                CONSTRAINT fk_reaction_comment
                    FOREIGN KEY (comment_id) REFERENCES Comment(comment_id) ON DELETE CASCADE
            );

            -- 9. Community_Group table
            CREATE TABLE IF NOT EXISTS Community_Group (
                group_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                group_name      TEXT NOT NULL,
                description     TEXT,
                created_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
                privacy_setting TEXT DEFAULT 'PUBLIC'
            );

            -- 10. Group_Members table
            CREATE TABLE IF NOT EXISTS Group_Members (
                group_id  INTEGER NOT NULL,
                user_id   INTEGER NOT NULL,
                join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                role      TEXT DEFAULT 'MEMBER',
                CONSTRAINT pk_group_members
                    PRIMARY KEY (group_id, user_id),
                CONSTRAINT fk_gm_group
                    FOREIGN KEY (group_id) REFERENCES Community_Group(group_id) ON DELETE CASCADE,
                CONSTRAINT fk_gm_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 11. Hashtag table
            CREATE TABLE IF NOT EXISTS Hashtag (
                hashtag_id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag        TEXT NOT NULL UNIQUE,
                category   TEXT
            );

            -- 12. Post_Hashtag table
            CREATE TABLE IF NOT EXISTS Post_Hashtag (
                post_id    INTEGER NOT NULL,
                hashtag_id INTEGER NOT NULL,
                CONSTRAINT pk_post_hashtag
                    PRIMARY KEY (post_id, hashtag_id),
                CONSTRAINT fk_ph_post
                    FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
                CONSTRAINT fk_ph_hashtag
                    FOREIGN KEY (hashtag_id) REFERENCES Hashtag(hashtag_id) ON DELETE CASCADE
            );

            -- 13. Notification table
            CREATE TABLE IF NOT EXISTS Notification (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_id    INTEGER NOT NULL,
                content         TEXT,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                ref_id          INTEGER,
                ref_type        TEXT,
                CONSTRAINT fk_notification_user
                    FOREIGN KEY (recipient_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 14. Friend_Recommendation table
            CREATE TABLE IF NOT EXISTS Friend_Recommendation (
                user_id             INTEGER NOT NULL,
                recommended_user_id INTEGER NOT NULL,
                score               REAL,
                generated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT pk_friend_recommendation
                    PRIMARY KEY (user_id, recommended_user_id),
                CONSTRAINT fk_fr_source_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                CONSTRAINT fk_fr_recommended_user
                    FOREIGN KEY (recommended_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                CONSTRAINT chk_fr_different_users
                    CHECK (user_id <> recommended_user_id)
            );

            -- 15. Message table
            CREATE TABLE IF NOT EXISTS Message (
                message_id  INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id   INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content     TEXT,
                sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_status TEXT DEFAULT 'UNREAD',
                CONSTRAINT fk_message_sender
                    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                CONSTRAINT fk_message_receiver
                    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 16. Event_Analysis table
            CREATE TABLE IF NOT EXISTS Event_Analysis (
                event_id    INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                event_type  TEXT,
                event_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
                device_type TEXT,
                metadata    TEXT,
                CONSTRAINT fk_event_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );
        """)
        conn.commit()

        # Seed sample data if fresh
        cursor.execute("SELECT COUNT(*) AS count FROM Users")
        if cursor.fetchone()["count"] == 0:
            cursor.executescript("""
                -- Users
                INSERT INTO Users (username, email, password, bio, account_status, dob) VALUES
                ('shobita', 'shobita@socialsphere.io', 'dbms108', 'Lead System Administrator & Database Architect', 'ACTIVE', '1990-05-20'),
                ('alice_w', 'alice@example.com', 'password123', 'Tech enthusiast & distributed systems researcher', 'ACTIVE', '1995-04-12'),
                ('bob_m', 'bob@example.com', 'password123', 'Landscape photographer and outdoor writer', 'ACTIVE', '1992-08-25'),
                ('charlie_dev', 'charlie@example.com', 'password123', 'Fullstack engineer & open-source maintainer', 'ACTIVE', '1998-11-03'),
                ('admin_user', 'admin@socialapp.com', 'password123', 'Platform Operations Lead', 'ACTIVE', '1988-01-15');

                -- User_Credentials table
                INSERT INTO User_Credentials (user_id, username, password_hash, account_role) VALUES
                (1, 'shobita', 'dbms108', 'SUPER_ADMIN'),
                (2, 'alice_w', 'password123', 'USER'),
                (3, 'bob_m', 'password123', 'USER'),
                (4, 'charlie_dev', 'password123', 'USER'),
                (5, 'admin_user', 'password123', 'OPS_ADMIN');

                -- Regular & Admin Users
                INSERT INTO Admin_User (user_id, admin_level) VALUES
                (1, 'SUPER_ADMIN'),
                (5, 'OPS_ADMIN');

                INSERT INTO Regular_User (user_id, interests, location) VALUES
                (1, 'Databases, Distributed Systems, SQL, Architecture', 'Zurich, Switzerland'),
                (2, 'FastAPI, Python, Machine Learning', 'San Francisco, CA'),
                (3, 'Photography, Mountain Expeditions, Optics', 'Denver, CO'),
                (4, 'Web Architecture, PostgreSQL, SQLite, React', 'Seattle, WA'),
                (5, 'Infrastructure, Security, Telemetry', 'Boston, MA');

                -- Profile Pics
                INSERT INTO Profile_Pic (user_id, image_url, pic_type) VALUES
                (1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'AVATAR'),
                (2, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'AVATAR'),
                (3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'AVATAR'),
                (4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'AVATAR'),
                (5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'AVATAR');

                -- Posts
                INSERT INTO Post (user_id, content, url, visibility) VALUES
                (1, 'System update: SQLite 16-table relational schema successfully verified with full index optimization. #database #architecture #systems', NULL, 'PUBLIC'),
                (2, 'Excited to publish our new open source benchmarking suite for FastAPI and SQLite! #python #opensource', 'https://github.com/project', 'PUBLIC'),
                (3, 'High alpine sunrise capture from 12,000 feet elevation in the Rocky Mountains. #photography #nature', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'PUBLIC'),
                (4, 'FastAPI dependency injection makes testing multi-table relational flows effortless. #python #webdev', NULL, 'PUBLIC');

                -- Comments
                INSERT INTO Comment (post_id, user_id, reply_to, content) VALUES
                (1, 2, NULL, 'Excellent work Shobita! The relational schema integrity is pristine.'),
                (1, 4, 1, 'Agreed! The foreign key cascades work flawlessly.'),
                (2, 3, NULL, 'Tested the benchmark on local node, great throughput numbers.');

                -- Reactions
                INSERT INTO Reaction (post_id, user_id, reaction_type, comment_id) VALUES
                (1, 2, 'LIKE', NULL),
                (1, 3, 'LOVE', NULL),
                (1, 4, 'FIRE', NULL),
                (2, 1, 'LIKE', NULL),
                (3, 1, 'LOVE', NULL);

                -- Community Groups & Members
                INSERT INTO Community_Group (group_name, description, privacy_setting) VALUES
                ('Database Architecture Circle', 'Deep dive into relational schemas, indexing, query optimization, and storage engines', 'PUBLIC'),
                ('Python Systems & Performance', 'High throughput microservices, asynchronous Python, and API design', 'PUBLIC'),
                ('Landscape Photography Collective', 'Camera optics, field workflows, and high dynamic range composition', 'PUBLIC');

                INSERT INTO Group_Members (group_id, user_id, role) VALUES
                (1, 1, 'ADMIN'),
                (1, 2, 'MEMBER'),
                (1, 4, 'MEMBER'),
                (2, 2, 'ADMIN'),
                (2, 1, 'MEMBER'),
                (3, 3, 'ADMIN'),
                (3, 1, 'MEMBER');

                -- Hashtags & Post_Hashtag
                INSERT INTO Hashtag (tag, category) VALUES
                ('database', 'Systems'),
                ('architecture', 'Engineering'),
                ('systems', 'Infrastructure'),
                ('python', 'Programming'),
                ('opensource', 'Software'),
                ('photography', 'Art'),
                ('nature', 'Travel'),
                ('webdev', 'Development');

                INSERT INTO Post_Hashtag (post_id, hashtag_id) VALUES
                (1, 1), (1, 2), (1, 3),
                (2, 4), (2, 5),
                (3, 6), (3, 7),
                (4, 4), (4, 8);

                -- Messages
                INSERT INTO Message (sender_id, receiver_id, content, read_status) VALUES
                (1, 2, 'Hello Alice, the new query telemetry tables are fully synchronized.', 'READ'),
                (2, 1, 'Confirmed, latency logs are showing sub-2ms response times.', 'READ'),
                (3, 1, 'Shared the high-resolution RAW captures in the photography archive.', 'UNREAD');

                -- Notifications
                INSERT INTO Notification (recipient_id, content, ref_id, ref_type) VALUES
                (1, 'Alice liked your database architecture update.', 1, 'POST'),
                (1, 'Charlie commented on your post.', 1, 'COMMENT'),
                (2, 'Shobita verified your system benchmark.', 2, 'POST');

                -- Friend Recommendations
                INSERT INTO Friend_Recommendation (user_id, recommended_user_id, score) VALUES
                (1, 2, 0.98),
                (1, 4, 0.94),
                (1, 3, 0.82),
                (2, 4, 0.91);

                -- Event Analysis
                INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata) VALUES
                (1, 'LOGIN', 'WORKSTATION', '{"user": "shobita", "role": "SUPER_ADMIN", "auth": "SUCCESS"}'),
                (1, 'SCHEMA_VERIFY', 'WORKSTATION', '{"tables": 16, "integrity": "OK"}'),
                (2, 'POST_CREATE', 'WEB', '{"post_id": 2, "topic": "benchmark"}'),
                (3, 'REACT_POST', 'MOBILE', '{"post_id": 1, "reaction": "LOVE"}');
            """)
            conn.commit()
        else:
            # Sync User_Credentials for existing users if any missing
            cursor.execute("""
                INSERT OR IGNORE INTO User_Credentials (user_id, username, password_hash, account_role)
                SELECT u.user_id, u.username, u.password, COALESCE(au.admin_level, 'USER')
                FROM Users u
                LEFT JOIN Admin_User au ON au.user_id = u.user_id
            """)
            # Ensure shobita exists with dbms108
            cursor.execute("SELECT user_id FROM Users WHERE username = 'shobita'")
            shobita = cursor.fetchone()
            if not shobita:
                cursor.execute("""
                    INSERT INTO Users (username, email, password, bio, account_status, dob)
                    VALUES ('shobita', 'shobita@socialsphere.io', 'dbms108', 'Lead System Administrator & Database Architect', 'ACTIVE', '1990-05-20')
                """)
                uid = cursor.lastrowid
                cursor.execute("INSERT OR REPLACE INTO Admin_User (user_id, admin_level) VALUES (?, 'SUPER_ADMIN')", (uid,))
                cursor.execute("INSERT OR REPLACE INTO Profile_Pic (user_id, image_url, pic_type) VALUES (?, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'AVATAR')", (uid,))
                cursor.execute("INSERT OR REPLACE INTO Regular_User (user_id, interests, location) VALUES (?, 'Databases, Distributed Systems, SQL, Architecture', 'Zurich, Switzerland')", (uid,))
                cursor.execute("INSERT OR REPLACE INTO User_Credentials (user_id, username, password_hash, account_role) VALUES (?, 'shobita', 'dbms108', 'SUPER_ADMIN')", (uid,))
            else:
                cursor.execute("UPDATE Users SET password = 'dbms108' WHERE username = 'shobita'")
                cursor.execute("UPDATE User_Credentials SET password_hash = 'dbms108' WHERE username = 'shobita'")
            conn.commit()
