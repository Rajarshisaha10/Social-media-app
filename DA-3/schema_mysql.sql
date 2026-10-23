-- =======================================================
-- MySQL Schema for Social Media Platform
-- Database: social_media
-- =======================================================

CREATE DATABASE IF NOT EXISTS social_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_media;

-- 1. Users
CREATE TABLE IF NOT EXISTS Users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(100) NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    bio            TEXT,
    account_status VARCHAR(50) DEFAULT 'ACTIVE',
    dob            VARCHAR(50),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User_Credentials
CREATE TABLE IF NOT EXISTS User_Credentials (
    credential_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    account_role  VARCHAR(50) DEFAULT 'USER',
    last_login    DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uc_user (user_id),
    INDEX idx_uc_username (username),
    CONSTRAINT fk_cred_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Profile_Pic
CREATE TABLE IF NOT EXISTS Profile_Pic (
    profile_pic_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    image_url      VARCHAR(1000) NOT NULL,
    pic_type       VARCHAR(50) DEFAULT 'AVATAR',
    INDEX idx_profile_pic_user (user_id),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Regular_User
CREATE TABLE IF NOT EXISTS Regular_User (
    user_id   INT PRIMARY KEY,
    interests TEXT,
    location  VARCHAR(255),
    CONSTRAINT fk_regular_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Admin_User
CREATE TABLE IF NOT EXISTS Admin_User (
    user_id     INT PRIMARY KEY,
    admin_level VARCHAR(50) NOT NULL,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Post
CREATE TABLE IF NOT EXISTS Post (
    post_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    content      TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    url          VARCHAR(1000),
    visibility   VARCHAR(50) DEFAULT 'PUBLIC',
    INDEX idx_post_user (user_id),
    INDEX idx_post_created (created_date DESC),
    CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Comment
CREATE TABLE IF NOT EXISTS Comment (
    comment_id   INT AUTO_INCREMENT PRIMARY KEY,
    post_id      INT NOT NULL,
    user_id      INT NOT NULL,
    reply_to     INT,
    content      TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comment_post (post_id),
    INDEX idx_comment_user (user_id),
    INDEX idx_comment_reply (reply_to),
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_reply FOREIGN KEY (reply_to) REFERENCES Comment(comment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reaction
CREATE TABLE IF NOT EXISTS Reaction (
    reaction_id   INT AUTO_INCREMENT PRIMARY KEY,
    post_id       INT NOT NULL,
    user_id       INT NOT NULL,
    reaction_type VARCHAR(50) NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    comment_id    INT,
    INDEX idx_reaction_post_user (post_id, user_id),
    INDEX idx_reaction_post (post_id),
    INDEX idx_reaction_comment (comment_id),
    CONSTRAINT fk_reaction_post FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reaction_comment FOREIGN KEY (comment_id) REFERENCES Comment(comment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Community_Group
CREATE TABLE IF NOT EXISTS Community_Group (
    group_id        INT AUTO_INCREMENT PRIMARY KEY,
    group_name      VARCHAR(255) NOT NULL,
    description     TEXT,
    created_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    privacy_setting VARCHAR(50) DEFAULT 'PUBLIC'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Group_Members
CREATE TABLE IF NOT EXISTS Group_Members (
    group_id  INT NOT NULL,
    user_id   INT NOT NULL,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    role      VARCHAR(50) DEFAULT 'MEMBER',
    PRIMARY KEY (group_id, user_id),
    INDEX idx_gm_user (user_id),
    CONSTRAINT fk_gm_group FOREIGN KEY (group_id) REFERENCES Community_Group(group_id) ON DELETE CASCADE,
    CONSTRAINT fk_gm_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Hashtag
CREATE TABLE IF NOT EXISTS Hashtag (
    hashtag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag        VARCHAR(100) NOT NULL UNIQUE,
    category   VARCHAR(100),
    INDEX idx_hashtag_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Post_Hashtag
CREATE TABLE IF NOT EXISTS Post_Hashtag (
    post_id    INT NOT NULL,
    hashtag_id INT NOT NULL,
    PRIMARY KEY (post_id, hashtag_id),
    INDEX idx_ph_hashtag (hashtag_id),
    CONSTRAINT fk_ph_post FOREIGN KEY (post_id) REFERENCES Post(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_ph_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtag(hashtag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Notification
CREATE TABLE IF NOT EXISTS Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id    INT NOT NULL,
    content         TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    ref_id          INT,
    ref_type        VARCHAR(50),
    INDEX idx_notif_recipient (recipient_id, created_at DESC),
    CONSTRAINT fk_notification_user FOREIGN KEY (recipient_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Friend_Recommendation
CREATE TABLE IF NOT EXISTS Friend_Recommendation (
    user_id             INT NOT NULL,
    recommended_user_id INT NOT NULL,
    score               DOUBLE,
    generated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recommended_user_id),
    INDEX idx_fr_user (user_id),
    CONSTRAINT fk_fr_source_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_fr_recommended_user FOREIGN KEY (recommended_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_fr_different_users CHECK (user_id <> recommended_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Message
CREATE TABLE IF NOT EXISTS Message (
    message_id  INT AUTO_INCREMENT PRIMARY KEY,
    sender_id   INT NOT NULL,
    receiver_id INT NOT NULL,
    content     TEXT,
    sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status VARCHAR(50) DEFAULT 'UNREAD',
    INDEX idx_msg_pair (sender_id, receiver_id, sent_at),
    INDEX idx_msg_receiver (receiver_id, read_status),
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Event_Analysis
CREATE TABLE IF NOT EXISTS Event_Analysis (
    event_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    event_type  VARCHAR(100),
    event_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
    device_type VARCHAR(50),
    metadata    TEXT,
    INDEX idx_event_user (user_id, event_time DESC),
    CONSTRAINT fk_event_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. User_Follow
CREATE TABLE IF NOT EXISTS User_Follow (
    follow_id    INT AUTO_INCREMENT PRIMARY KEY,
    follower_id  INT NOT NULL,
    following_id INT NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_follower_following (follower_id, following_id),
    INDEX idx_follow_follower (follower_id),
    INDEX idx_follow_following (following_id),
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_not_self_follow CHECK (follower_id <> following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
