-- =======================================================
-- SQLite Schema for Social Media Platform
-- =======================================================

CREATE TABLE IF NOT EXISTS Users (
    user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT NOT NULL UNIQUE,
    email          TEXT NOT NULL UNIQUE,
    password       TEXT NOT NULL,
    bio            TEXT,
    account_status TEXT DEFAULT 'ACTIVE',
    dob            TEXT
);

CREATE TABLE IF NOT EXISTS Profile_Pic (
    profile_pic_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    image_url      TEXT NOT NULL,
    pic_type       TEXT DEFAULT 'AVATAR',
    CONSTRAINT fk_profile_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Regular_User (
    user_id   INTEGER PRIMARY KEY,
    interests TEXT,
    location  TEXT,
    CONSTRAINT fk_regular_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Admin_User (
    user_id     INTEGER PRIMARY KEY,
    admin_level TEXT NOT NULL,
    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS Community_Group (
    group_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name      TEXT NOT NULL,
    description     TEXT,
    created_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    privacy_setting TEXT DEFAULT 'PUBLIC'
);

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

CREATE TABLE IF NOT EXISTS Hashtag (
    hashtag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag        TEXT NOT NULL UNIQUE,
    category   TEXT
);

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
