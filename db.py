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

            -- 2. Profile_Pic table
            CREATE TABLE IF NOT EXISTS Profile_Pic (
                profile_pic_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL,
                image_url      TEXT NOT NULL,
                pic_type       TEXT DEFAULT 'AVATAR',
                CONSTRAINT fk_profile_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 3. Regular_User table
            CREATE TABLE IF NOT EXISTS Regular_User (
                user_id   INTEGER PRIMARY KEY,
                interests TEXT,
                location  TEXT,
                CONSTRAINT fk_regular_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 4. Admin_User table
            CREATE TABLE IF NOT EXISTS Admin_User (
                user_id     INTEGER PRIMARY KEY,
                admin_level TEXT NOT NULL,
                CONSTRAINT fk_admin_user
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
            );

            -- 5. Post table
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

            -- 6. Comment table
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

            -- 7. Reaction table
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

            -- 8. Community_Group table
            CREATE TABLE IF NOT EXISTS Community_Group (
                group_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                group_name      TEXT NOT NULL,
                description     TEXT,
                created_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
                privacy_setting TEXT DEFAULT 'PUBLIC'
            );

            -- 9. Group_Members table
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

            -- 10. Hashtag table
            CREATE TABLE IF NOT EXISTS Hashtag (
                hashtag_id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag        TEXT NOT NULL UNIQUE,
                category   TEXT
            );

            -- 11. Post_Hashtag table
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

            -- 12. Notification table
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

            -- 13. Friend_Recommendation table
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

            -- 14. Message table
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

            -- 15. Event_Analysis table
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
                ('alice_w', 'alice@example.com', 'hashed_pass_123', 'Tech enthusiast & coffee lover', 'ACTIVE', '1995-04-12'),
                ('bob_m', 'bob@example.com', 'hashed_pass_456', 'Outdoor photographer and hiker', 'ACTIVE', '1992-08-25'),
                ('charlie_dev', 'charlie@example.com', 'hashed_pass_789', 'Fullstack engineer & open-source contributor', 'ACTIVE', '1998-11-03'),
                ('admin_user', 'admin@socialapp.com', 'hashed_admin_pass', 'Platform Administrator', 'ACTIVE', '1988-01-15');

                -- Regular & Admin Users
                INSERT INTO Regular_User (user_id, interests, location) VALUES
                (1, 'Coding, Photography, AI', 'San Francisco, CA'),
                (2, 'Hiking, Wildlife, Cinema', 'Denver, CO'),
                (3, 'Web Development, Gaming, Music', 'Seattle, WA');

                INSERT INTO Admin_User (user_id, admin_level) VALUES
                (4, 'SUPER_ADMIN');

                -- Profile Pics
                INSERT INTO Profile_Pic (user_id, image_url, pic_type) VALUES
                (1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'AVATAR'),
                (2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'AVATAR'),
                (3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'AVATAR');

                -- Posts
                INSERT INTO Post (user_id, content, url, visibility) VALUES
                (1, 'Excited to announce my new open source project! Check it out.', 'https://github.com/project', 'PUBLIC'),
                (2, 'Captured an incredible sunrise at Rocky Mountain National Park today.', 'https://photos.example.com/sunrise.jpg', 'PUBLIC'),
                (3, 'FastAPI and SQLite make backend development remarkably fast.', NULL, 'PUBLIC');

                -- Comments
                INSERT INTO Comment (post_id, user_id, reply_to, content) VALUES
                (1, 2, NULL, 'Looks amazing Alice! Starred the repo.'),
                (1, 1, 1, 'Thanks Bob! Appreciate the feedback.'),
                (2, 3, NULL, 'Stunning view, what camera settings did you use?');

                -- Reactions
                INSERT INTO Reaction (post_id, user_id, reaction_type, comment_id) VALUES
                (1, 2, 'LIKE', NULL),
                (1, 3, 'LOVE', NULL),
                (2, 1, 'FIRE', NULL),
                (1, 3, 'LIKE', 1);

                -- Community Groups & Members
                INSERT INTO Community_Group (group_name, description, privacy_setting) VALUES
                ('Python Developers', 'A community for Python, FastAPI, and data science enthusiasts', 'PUBLIC'),
                ('Photography Hub', 'Share your best captures and camera gear tips', 'PUBLIC');

                INSERT INTO Group_Members (group_id, user_id, role) VALUES
                (1, 1, 'ADMIN'),
                (1, 3, 'MEMBER'),
                (2, 2, 'ADMIN'),
                (2, 1, 'MEMBER');

                -- Hashtags & Post_Hashtag
                INSERT INTO Hashtag (tag, category) VALUES
                ('python', 'Technology'),
                ('opensource', 'Technology'),
                ('photography', 'Art'),
                ('nature', 'Travel');

                INSERT INTO Post_Hashtag (post_id, hashtag_id) VALUES
                (1, 1),
                (1, 2),
                (2, 3),
                (2, 4);

                -- Messages
                INSERT INTO Message (sender_id, receiver_id, content, read_status) VALUES
                (1, 2, 'Hey Bob, did you see the new photo updates?', 'READ'),
                (2, 1, 'Yes! Truly breathtaking shots.', 'UNREAD');

                -- Notifications
                INSERT INTO Notification (recipient_id, content, ref_id, ref_type) VALUES
                (1, 'Bob liked your post.', 1, 'POST'),
                (2, 'Charlie commented on your photo.', 2, 'COMMENT');

                -- Friend Recommendations
                INSERT INTO Friend_Recommendation (user_id, recommended_user_id, score) VALUES
                (1, 2, 0.95),
                (1, 3, 0.88),
                (2, 3, 0.74);

                -- Event Analysis
                INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata) VALUES
                (1, 'LOGIN', 'WEB', '{"browser": "Chrome", "ip": "127.0.0.1"}'),
                (2, 'POST_CREATE', 'MOBILE', '{"post_id": 2, "os": "iOS"}'),
                (3, 'LIKE_POST', 'WEB', '{"post_id": 1, "browser": "Firefox"}');
            """)
            conn.commit()
