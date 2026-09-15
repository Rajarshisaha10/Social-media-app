-- =======================================================
-- Full Database Deployment for klouds.online (dbms-da-db)
-- =======================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================
-- MySQL Schema for Social Media Platform
-- Database: social_media
-- =======================================================




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


-- =======================================================
-- 2. Seed & Initial Data Across All 17 Tables
-- =======================================================

-- Table: `Users` (13 rows)
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (1, 'kandarp', 'kandarp@socialsphere.io', 'hashed_pass_123', 'Tech enthusiast & distributed systems researcher', 'ACTIVE', '1995-04-12', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (2, 'Shobita', 'shobita@socialsphere.io', 'hashed_pass_456', 'Landscape photographer & creative tech writer', 'ACTIVE', '1992-08-25', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (3, 'Aditi', 'aditi@socialsphere.io', 'hashed_pass_789', 'Fullstack engineer & open-source maintainer', 'ACTIVE', '1998-11-03', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (4, 'admin_user', 'admin@socialapp.com', 'hashed_admin_pass', 'Platform Administrator', 'ACTIVE', '1988-01-15', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (5, 'rajarshi', 'rajarshi@socialsphere.io', 'dbms108', 'Lead System Administrator & Database Architect', 'ACTIVE', '1990-05-20', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (13, 'rajarshi10', 'rajarshi@gmail.com', 'dbms108i', 'Tirth is Nerd Mota', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (15, 'Ritvik', 'ritvik@socialsphere.io', 'password123', 'Frontend enthusiast & React developer', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (16, 'Shivansh', 'shivansh@socialsphere.io', 'password123', 'Backend engineer & distributed systems', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (17, 'Akshat', 'akshat@socialsphere.io', 'password123', 'Machine learning & AI researcher', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (18, 'Likitha', 'likitha@socialsphere.io', 'password123', 'Full-stack developer & design lover', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (19, 'Ridhima', 'ridhima@socialsphere.io', 'password123', 'Product architect & community lead', 'ACTIVE', '2000-01-01', '2026-09-15 21:34:50');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (27, 'dev_1789491058', 'dev_1789491058@socialsphere.io', 'securepass123', 'Automated test user', 'ACTIVE', '2000-01-01', '2026-09-15 22:20:58');
INSERT INTO `Users` (`user_id`, `username`, `email`, `password`, `bio`, `account_status`, `dob`, `created_at`) VALUES (28, 'dev_1789491513', 'dev_1789491513@socialsphere.io', 'securepass123', 'Automated test user', 'ACTIVE', '2000-01-01', '2026-09-15 22:28:33');

-- Table: `User_Credentials` (20 rows)
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (1, 1, 'kandarp', 'hashed_pass_123', 'USER', '2026-09-15 06:55:26', '2026-09-15 06:55:26');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (2, 2, 'Shobita', 'hashed_pass_456', 'USER', '2026-09-15 06:55:26', '2026-09-15 06:55:26');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (3, 3, 'Aditi', 'hashed_pass_789', 'USER', '2026-09-15 06:55:26', '2026-09-15 06:55:26');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (4, 4, 'admin_user', 'hashed_admin_pass', 'SUPER_ADMIN', '2026-09-15 06:55:26', '2026-09-15 06:55:26');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (5, 5, 'rajarshi', 'dbms108', 'SUPER_ADMIN', '2026-09-15 22:28:33', '2026-09-15 06:55:26');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (202, 13, 'rajarshi10', 'dbms108i', 'USER', '2026-09-15 22:21:32', '2026-09-15 14:02:42');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (280, 15, 'Ritvik', 'password123', 'USER', '2026-09-15 14:23:47', '2026-09-15 14:12:31');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (281, 16, 'Shivansh', 'password123', 'USER', '2026-09-15 14:24:04', '2026-09-15 14:12:31');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (282, 17, 'Akshat', 'password123', 'USER', '2026-09-15 14:24:04', '2026-09-15 14:12:31');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (283, 18, 'Likitha', 'password123', 'USER', '2026-09-15 14:24:04', '2026-09-15 14:12:31');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (284, 19, 'Ridhima', 'password123', 'USER', '2026-09-15 14:24:04', '2026-09-15 14:12:31');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (288, 20, 'dev_1789488890', 'securepass123', 'USER', '2026-09-15 21:44:50', '2026-09-15 21:44:50');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (290, 21, 'dev_1789488922', 'securepass123', 'USER', '2026-09-15 21:45:22', '2026-09-15 21:45:22');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (292, 22, 'dev_1789488928', 'securepass123', 'USER', '2026-09-15 21:45:28', '2026-09-15 21:45:28');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (294, 23, 'dev_1789488934', 'securepass123', 'USER', '2026-09-15 21:45:34', '2026-09-15 21:45:34');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (296, 24, 'dev_1789489075', 'securepass123', 'USER', '2026-09-15 21:47:55', '2026-09-15 21:47:55');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (298, 25, 'dev_1789489156', 'securepass123', 'USER', '2026-09-15 21:49:16', '2026-09-15 21:49:16');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (300, 26, 'dev_1789489170', 'securepass123', 'USER', '2026-09-15 21:49:30', '2026-09-15 21:49:30');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (314, 27, 'dev_1789491058', 'securepass123', 'USER', '2026-09-15 22:20:58', '2026-09-15 22:20:58');
INSERT INTO `User_Credentials` (`credential_id`, `user_id`, `username`, `password_hash`, `account_role`, `last_login`, `created_at`) VALUES (320, 28, 'dev_1789491513', 'securepass123', 'USER', '2026-09-15 22:28:33', '2026-09-15 22:28:33');

-- Table: `Profile_Pic` (19 rows)
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (1, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (2, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (3, 3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (4, 5, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (12, 13, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (14, 15, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (15, 16, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (16, 17, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (17, 18, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (18, 19, 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (19, 20, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (20, 21, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (21, 22, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (22, 23, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (23, 24, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (24, 25, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (25, 26, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (26, 27, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');
INSERT INTO `Profile_Pic` (`profile_pic_id`, `user_id`, `image_url`, `pic_type`) VALUES (27, 28, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 'AVATAR');

-- Table: `Regular_User` (19 rows)
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (1, 'Coding, Photography, AI', 'San Francisco, CA');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (2, 'Hiking, Wildlife, Cinema', 'Denver, CO');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (3, 'Web Development, Gaming, Music', 'Seattle, WA');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (5, 'Databases, Distributed Systems, SQL, Architecture', 'Zurich, Switzerland');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (13, 'Shauri', 'Chennai');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (15, 'React, Web Development, UI/UX', 'Mumbai, India');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (16, 'Python, Databases, APIs', 'Bangalore, India');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (17, 'AI, Python, Data Science', 'Delhi, India');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (18, 'React, Cloud, Design', 'Hyderabad, India');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (19, 'Management, Tech, Communities', 'Pune, India');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (20, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (21, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (22, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (23, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (24, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (25, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (26, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (27, 'SQL, Python', 'Cloud');
INSERT INTO `Regular_User` (`user_id`, `interests`, `location`) VALUES (28, 'SQL, Python', 'Cloud');

-- Table: `Admin_User` (2 rows)
INSERT INTO `Admin_User` (`user_id`, `admin_level`) VALUES (4, 'SUPER_ADMIN');
INSERT INTO `Admin_User` (`user_id`, `admin_level`) VALUES (5, 'SUPER_ADMIN');

-- Table: `Post` (10 rows)
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (1, 5, 'System Update: MySQL 8 relational schema with connection pooling & composite indexes is now active. Query latency is down to sub-25ms across all 17 tables! #database #architecture #systems #mysql', '2026-09-15 21:54:12', NULL, 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (2, 15, 'Shipped the new React feed components! The mobile bottom navigation fits perfectly now and we added quick-access SQL studio tabs. Check it out! #react #webdev #frontend', '2026-09-15 21:19:12', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (3, 16, 'Benchmarking MySQL 8 connection pooling against FastAPI asynchronous endpoints. Sustaining 1,200 requests/sec with minimal memory footprint. #python #fastapi #performance #backend', '2026-09-15 20:29:12', 'https://images.unsplash.com/photo-1518770660439-4636190af475', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (4, 17, 'Exploring cloud database hosting on KloudsPanel. Having built-in query studios, automated backups, and internal VPC routing simplifies deployments tremendously! #cloud #devops #mysql', '2026-09-15 19:39:12', NULL, 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (5, 18, 'Designing the new profile and social graph analytics page. What metrics do you look for most—engagement rate or follower growth? #uiux #design #analytics', '2026-09-15 18:39:12', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (6, 19, 'Fresh icon set and brand palette exported for the social app. Keeping things sleek with deep navy and electric violet accents. ✨ #design #branding #creative', '2026-09-15 17:19:12', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (7, 2, 'Golden hour reflection capture over alpine waters at 11,500 feet elevation. Uncompressed RAW edit uploaded to our photography collective. #photography #nature #mountains', '2026-09-15 16:19:12', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (8, 3, 'Writing comprehensive integration test suites for relational cascades in MySQL. Foreign key constraints make data consistency effortless! #testing #mysql #architecture', '2026-09-15 15:19:12', NULL, 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (9, 1, 'Excited to collaborate on the distributed query benchmarking suite! The new SQL Studio execution speeds are super responsive. #opensource #sql #database', '2026-09-15 14:19:12', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', 'PUBLIC');
INSERT INTO `Post` (`post_id`, `user_id`, `content`, `created_date`, `url`, `visibility`) VALUES (10, 4, 'Platform Health Notice: All database nodes, connection pools, and real-time telemetry streams are running green with 99.99% uptime. #ops #infrastructure #devops', '2026-09-15 13:19:12', NULL, 'PUBLIC');

-- Table: `Comment` (14 rows)
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (1, 1, 15, NULL, 'The feed rendering speed is night and day compared to before!', '2026-09-15 22:04:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (2, 1, 16, NULL, 'Verified the connection pool thread safety, zero socket contention.', '2026-09-15 22:04:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (3, 2, 17, NULL, 'Love the dark mode glassmorphism card styling.', '2026-09-15 21:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (4, 2, 18, NULL, 'The mobile layout feels super responsive on phones.', '2026-09-15 21:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (5, 3, 5, NULL, 'Great numbers Shivansh. The composite indexes on post/user pairs are doing their job.', '2026-09-15 20:39:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (6, 4, 16, NULL, 'Setting up our staging replica on it today.', '2026-09-15 19:49:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (7, 5, 19, NULL, 'Engagement rate by tag category is definitely the most insightful!', '2026-09-15 18:49:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (8, 5, 15, NULL, 'Would love to see reaction breakdowns visualized with smooth pie charts.', '2026-09-15 18:49:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (9, 6, 18, NULL, 'The violet accent pops brilliantly against the dark slate cards.', '2026-09-15 17:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (10, 7, 1, NULL, 'The dynamic range in this shot is unreal!', '2026-09-15 16:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (11, 7, 3, NULL, 'Incredible sharpness on the water reflections.', '2026-09-15 16:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (12, 8, 5, NULL, 'All 17 tables are passing foreign key cascades seamlessly in test_backend.py.', '2026-09-15 15:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (13, 9, 3, NULL, 'The preset queries in SQL Studio make testing schema variations so convenient.', '2026-09-15 14:29:12');
INSERT INTO `Comment` (`comment_id`, `post_id`, `user_id`, `reply_to`, `content`, `created_date`) VALUES (14, 10, 5, NULL, 'Telemetry audits confirm clean 200 responses across all user requests.', '2026-09-15 13:29:12');

-- Table: `Reaction` (32 rows)
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (1, 1, 15, 'FIRE', '2026-09-15 21:59:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (2, 1, 16, 'LIKE', '2026-09-15 21:59:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (3, 1, 3, 'LOVE', '2026-09-15 21:59:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (4, 1, 1, 'FIRE', '2026-09-15 21:59:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (5, 2, 17, 'FIRE', '2026-09-15 21:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (6, 2, 18, 'LOVE', '2026-09-15 21:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (7, 2, 19, 'LIKE', '2026-09-15 21:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (8, 2, 5, 'FIRE', '2026-09-15 21:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (9, 3, 5, 'FIRE', '2026-09-15 20:34:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (10, 3, 15, 'LIKE', '2026-09-15 20:34:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (11, 3, 1, 'LOVE', '2026-09-15 20:34:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (12, 4, 16, 'LIKE', '2026-09-15 19:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (13, 4, 5, 'FIRE', '2026-09-15 19:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (14, 4, 3, 'LIKE', '2026-09-15 19:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (15, 5, 19, 'LOVE', '2026-09-15 18:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (16, 5, 15, 'LIKE', '2026-09-15 18:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (17, 5, 2, 'LOVE', '2026-09-15 18:44:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (18, 6, 18, 'LOVE', '2026-09-15 17:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (19, 6, 17, 'FIRE', '2026-09-15 17:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (20, 6, 2, 'LIKE', '2026-09-15 17:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (21, 7, 1, 'LOVE', '2026-09-15 16:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (22, 7, 3, 'LOVE', '2026-09-15 16:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (23, 7, 5, 'FIRE', '2026-09-15 16:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (24, 7, 15, 'LIKE', '2026-09-15 16:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (25, 8, 5, 'FIRE', '2026-09-15 15:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (26, 8, 1, 'LIKE', '2026-09-15 15:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (27, 8, 16, 'LIKE', '2026-09-15 15:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (28, 9, 3, 'LIKE', '2026-09-15 14:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (29, 9, 5, 'FIRE', '2026-09-15 14:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (30, 9, 16, 'LIKE', '2026-09-15 14:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (32, 10, 16, 'LIKE', '2026-09-15 13:24:12', NULL);
INSERT INTO `Reaction` (`reaction_id`, `post_id`, `user_id`, `reaction_type`, `created_at`, `comment_id`) VALUES (33, 10, 17, 'LIKE', '2026-09-15 13:24:12', NULL);

-- Table: `Community_Group` (2 rows)
INSERT INTO `Community_Group` (`group_id`, `group_name`, `description`, `created_date`, `privacy_setting`) VALUES (1, 'Python Developers', 'A community for Python, FastAPI, and data science enthusiasts', '2026-09-13 13:03:03', 'PUBLIC');
INSERT INTO `Community_Group` (`group_id`, `group_name`, `description`, `created_date`, `privacy_setting`) VALUES (2, 'Photography Hub', 'Share your best captures and camera gear tips', '2026-09-13 13:03:03', 'PUBLIC');

-- Table: `Group_Members` (5 rows)
INSERT INTO `Group_Members` (`group_id`, `user_id`, `join_date`, `role`) VALUES (1, 1, '2026-09-13 13:03:03', 'ADMIN');
INSERT INTO `Group_Members` (`group_id`, `user_id`, `join_date`, `role`) VALUES (1, 3, '2026-09-13 13:03:03', 'MEMBER');
INSERT INTO `Group_Members` (`group_id`, `user_id`, `join_date`, `role`) VALUES (1, 4, '2026-09-15 06:48:33', 'MEMBER');
INSERT INTO `Group_Members` (`group_id`, `user_id`, `join_date`, `role`) VALUES (2, 1, '2026-09-13 13:03:03', 'MEMBER');
INSERT INTO `Group_Members` (`group_id`, `user_id`, `join_date`, `role`) VALUES (2, 2, '2026-09-13 13:03:03', 'ADMIN');

-- Table: `Hashtag` (26 rows)
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (1, 'database', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (2, 'architecture', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (3, 'systems', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (4, 'mysql', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (5, 'react', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (6, 'webdev', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (7, 'frontend', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (8, 'python', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (9, 'fastapi', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (10, 'performance', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (11, 'backend', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (12, 'cloud', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (13, 'devops', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (14, 'uiux', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (15, 'design', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (16, 'analytics', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (17, 'branding', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (18, 'creative', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (19, 'photography', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (20, 'nature', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (21, 'mountains', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (22, 'testing', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (23, 'opensource', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (24, 'sql', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (25, 'ops', 'General');
INSERT INTO `Hashtag` (`hashtag_id`, `tag`, `category`) VALUES (26, 'infrastructure', 'General');

-- Table: `Post_Hashtag` (32 rows)
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (1, 1);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (9, 1);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (1, 2);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (8, 2);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (1, 3);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (1, 4);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (4, 4);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (8, 4);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (2, 5);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (2, 6);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (2, 7);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (3, 8);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (3, 9);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (3, 10);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (3, 11);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (4, 12);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (4, 13);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (10, 13);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (5, 14);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (5, 15);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (6, 15);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (5, 16);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (6, 17);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (6, 18);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (7, 19);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (7, 20);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (7, 21);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (8, 22);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (9, 23);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (9, 24);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (10, 25);
INSERT INTO `Post_Hashtag` (`post_id`, `hashtag_id`) VALUES (10, 26);

-- Table: `Notification` (48 rows)
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (1, 1, 'Bob liked your post.', '2026-09-13 13:03:03', 1, 'POST');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (2, 2, 'Charlie commented on your photo.', '2026-09-13 13:03:03', 2, 'COMMENT');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (8, 3, 'rajarshi10 reacted with LIKE to your post.', '2026-09-15 14:11:02', 3, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (9, 3, 'rajarshi10 reacted with LIKE to your post.', '2026-09-15 14:11:04', 3, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (13, 2, 'rajarshi10 commented: DSLR...', '2026-09-15 14:59:10', 2, 'COMMENT');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (14, 20, '@Shobita started following you.', '2026-09-15 21:44:50', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (15, 21, '@Shobita started following you.', '2026-09-15 21:45:22', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (16, 22, '@Shobita started following you.', '2026-09-15 21:45:28', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (17, 23, '@Shobita started following you.', '2026-09-15 21:45:34', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (18, 24, '@Shobita started following you.', '2026-09-15 21:47:55', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (19, 25, '@Shobita started following you.', '2026-09-15 21:49:16', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (20, 26, '@Shobita started following you.', '2026-09-15 21:49:30', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (21, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:43', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (22, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:43', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (23, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:43', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (24, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:43', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (25, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:43', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (26, 2, 'kandarp sent you a message: Benchmark ping #0...', '2026-09-15 21:50:43', 3, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (27, 2, 'kandarp sent you a message: Benchmark ping #1...', '2026-09-15 21:50:43', 4, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (28, 2, 'kandarp sent you a message: Benchmark ping #2...', '2026-09-15 21:50:43', 5, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (29, 2, 'kandarp sent you a message: Benchmark ping #3...', '2026-09-15 21:50:43', 6, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (30, 2, 'kandarp sent you a message: Benchmark ping #4...', '2026-09-15 21:50:43', 7, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (31, 2, 'kandarp sent you a message: Benchmark ping #5...', '2026-09-15 21:50:43', 8, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (32, 2, 'kandarp sent you a message: Benchmark ping #6...', '2026-09-15 21:50:43', 9, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (33, 2, 'kandarp sent you a message: Benchmark ping #7...', '2026-09-15 21:50:43', 10, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (34, 2, 'kandarp sent you a message: Benchmark ping #8...', '2026-09-15 21:50:43', 11, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (35, 2, 'kandarp sent you a message: Benchmark ping #9...', '2026-09-15 21:50:43', 12, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (36, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:45', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (37, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:45', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (38, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:45', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (39, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:45', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (40, 1, 'Shobita reacted with LIKE to your post.', '2026-09-15 21:50:45', 1, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (41, 2, 'kandarp sent you a message: Benchmark ping #0...', '2026-09-15 21:50:45', 13, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (42, 2, 'kandarp sent you a message: Benchmark ping #1...', '2026-09-15 21:50:45', 14, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (43, 2, 'kandarp sent you a message: Benchmark ping #2...', '2026-09-15 21:50:46', 15, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (44, 2, 'kandarp sent you a message: Benchmark ping #3...', '2026-09-15 21:50:46', 16, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (45, 2, 'kandarp sent you a message: Benchmark ping #4...', '2026-09-15 21:50:46', 17, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (46, 2, 'kandarp sent you a message: Benchmark ping #5...', '2026-09-15 21:50:46', 18, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (47, 2, 'kandarp sent you a message: Benchmark ping #6...', '2026-09-15 21:50:46', 19, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (48, 2, 'kandarp sent you a message: Benchmark ping #7...', '2026-09-15 21:50:46', 20, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (49, 2, 'kandarp sent you a message: Benchmark ping #8...', '2026-09-15 21:50:46', 21, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (50, 2, 'kandarp sent you a message: Benchmark ping #9...', '2026-09-15 21:50:46', 22, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (51, 2, 'kandarp sent you a message: MySQL migration live verificat...', '2026-09-15 21:57:06', 23, 'MESSAGE');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (52, 1, 'rajarshi10 reacted with LIKE to your post.', '2026-09-15 22:06:06', 26, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (53, 1, 'rajarshi10 reacted with LIKE to your post.', '2026-09-15 22:06:08', 25, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (54, 27, '@Shobita started following you.', '2026-09-15 22:20:58', 2, 'USER');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (55, 4, 'rajarshi reacted with LIKE to your post.', '2026-09-15 22:26:48', 10, 'REACTION');
INSERT INTO `Notification` (`notification_id`, `recipient_id`, `content`, `created_at`, `ref_id`, `ref_type`) VALUES (56, 28, '@Shobita started following you.', '2026-09-15 22:28:33', 2, 'USER');

-- Table: `Friend_Recommendation` (3 rows)
INSERT INTO `Friend_Recommendation` (`user_id`, `recommended_user_id`, `score`, `generated_at`) VALUES (1, 2, 0.95, '2026-09-13 13:03:03');
INSERT INTO `Friend_Recommendation` (`user_id`, `recommended_user_id`, `score`, `generated_at`) VALUES (1, 3, 0.88, '2026-09-13 13:03:03');
INSERT INTO `Friend_Recommendation` (`user_id`, `recommended_user_id`, `score`, `generated_at`) VALUES (2, 3, 0.74, '2026-09-13 13:03:03');

-- Table: `Message` (26 rows)
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (1, 15, 16, 'Hey Shivansh! Are you reviewing the latest MySQL migration PR?', '2026-09-15 20:07:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (2, 16, 15, 'Yes! The query latency dropped from 250ms down to sub-30ms with connection pooling.', '2026-09-15 20:22:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (3, 15, 16, 'That is incredible. The feed loads way smoother now.', '2026-09-15 20:37:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (4, 17, 15, 'Hey Ritvik, did you push the new component designs?', '2026-09-15 20:47:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (5, 15, 17, 'Pushed them to main 10 minutes ago, check them out!', '2026-09-15 21:07:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (6, 17, 15, 'Reviewing now, the dark mode styling is pristine.', '2026-09-15 21:22:56', 'UNREAD');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (7, 18, 19, 'Hey Ridhima, are you joining the design sync this afternoon?', '2026-09-15 19:37:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (8, 19, 18, 'Yes! I have the new UI mockups and icon sets ready to present.', '2026-09-15 19:57:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (9, 18, 19, 'Awesome, looking forward to seeing the new profile page flow.', '2026-09-15 20:17:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (10, 19, 18, 'Just shared the Figma link on the community board!', '2026-09-15 20:32:56', 'UNREAD');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (11, 3, 1, 'Hey Kandarp, verified the database schema on MySQL 8. All foreign keys are enforcing cascades.', '2026-09-15 19:07:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (12, 1, 3, 'Great work Aditi! Did you also verify the hashtag composite indexes?', '2026-09-15 19:27:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (13, 3, 1, 'Yes, index lookups on tags are instant now.', '2026-09-15 19:47:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (14, 2, 3, 'Uploaded the high-res gallery shots for the feed banner!', '2026-09-15 18:47:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (15, 3, 2, 'These look stunning Shobita! The compression and aspect ratio are spot on.', '2026-09-15 19:12:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (16, 16, 17, 'Akshat, what do you think about deploying the MySQL cluster on Klouds?', '2026-09-15 20:52:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (17, 17, 16, 'Definitely, it gives us dedicated query logs and low-latency internal routing.', '2026-09-15 21:12:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (18, 16, 17, 'Sounds like a plan. Let us set up the connection pool limits today.', '2026-09-15 21:37:56', 'UNREAD');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (19, 18, 15, 'Ritvik, the mobile bottom navigation feels much cleaner without the horizontal scroll.', '2026-09-15 21:02:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (20, 15, 18, 'Thanks Likitha! Added the mobile logout button as well.', '2026-09-15 21:27:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (21, 5, 15, 'Ritvik, overall backend telemetry is reporting clean 200 responses across all endpoints.', '2026-09-15 21:17:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (22, 15, 5, 'Confirmed Rajarshi, both the frontend and SQL Studio are running flawlessly.', '2026-09-15 21:42:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (23, 19, 16, 'Hey Shivansh, do you need any extra assets for the analytics graphs?', '2026-09-15 21:32:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (24, 16, 19, 'All good for now, thanks! The chart color tokens you picked look great.', '2026-09-15 21:52:56', 'UNREAD');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (25, 1, 5, 'Hey Rajarshi, the connection pool mincached and maxcached settings are working great.', '2026-09-15 21:22:56', 'READ');
INSERT INTO `Message` (`message_id`, `sender_id`, `receiver_id`, `content`, `sent_at`, `read_status`) VALUES (26, 5, 1, 'Excellent, memory footprint is steady and thread contention is zero.', '2026-09-15 21:47:56', 'READ');

-- Table: `Event_Analysis` (166 rows)
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (1, 1, 'LOGIN', '2026-09-13 13:03:03', 'WEB', '{"browser": "Chrome", "ip": "127.0.0.1"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (2, 2, 'POST_CREATE', '2026-09-13 13:03:03', 'MOBILE', '{"post_id": 2, "os": "iOS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (3, 3, 'LIKE_POST', '2026-09-13 13:03:03', 'WEB', '{"post_id": 1, "browser": "Firefox"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (4, 1, 'POST_CREATE', '2026-09-13 13:10:27', 'WEB', '{"post_id": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (5, 5, 'LOGIN', '2026-09-15 06:39:55', 'WEB', '{"username": "shobita", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (6, 5, 'LOGIN', '2026-09-15 06:47:27', 'WEB', '{"username": "shobita", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (8, 5, 'LOGIN', '2026-09-15 06:55:27', 'WEB', '{"username": "shobita", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (9, 5, 'LOGIN', '2026-09-15 06:55:49', 'WEB', '{"username": "shobita", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (11, 5, 'LOGIN', '2026-09-15 07:13:51', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (13, 2, 'FOLLOW', '2026-09-15 07:13:51', 'WEB', '{"target_user_id": 8, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (14, 2, 'UNFOLLOW', '2026-09-15 07:13:52', 'WEB', '{"target_user_id": 8, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (15, 5, 'LOGIN', '2026-09-15 07:14:12', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (17, 2, 'FOLLOW', '2026-09-15 07:14:12', 'WEB', '{"target_user_id": 9, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (18, 2, 'UNFOLLOW', '2026-09-15 07:14:12', 'WEB', '{"target_user_id": 9, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (19, 5, 'LOGIN', '2026-09-15 07:48:22', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (20, 5, 'LOGIN', '2026-09-15 07:53:02', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (22, 2, 'FOLLOW', '2026-09-15 07:53:02', 'WEB', '{"target_user_id": 10, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (23, 2, 'UNFOLLOW', '2026-09-15 07:53:03', 'WEB', '{"target_user_id": 10, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (24, 5, 'LOGIN', '2026-09-15 08:06:58', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (26, 2, 'FOLLOW', '2026-09-15 08:06:58', 'WEB', '{"target_user_id": 11, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (27, 2, 'UNFOLLOW', '2026-09-15 08:06:58', 'WEB', '{"target_user_id": 11, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (29, 13, 'REGISTER', '2026-09-15 14:02:42', 'WEB', '{"username": "rajarshi10", "email": "rajarshi@gmail.com", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (30, 13, 'POST_CREATE', '2026-09-15 14:02:57', 'WEB', '{"post_id": 5, "tags_count": 0}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (31, 5, 'LOGIN', '2026-09-15 14:04:49', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (33, 2, 'FOLLOW', '2026-09-15 14:04:49', 'WEB', '{"target_user_id": 14, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (34, 2, 'UNFOLLOW', '2026-09-15 14:04:49', 'WEB', '{"target_user_id": 14, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (35, 13, 'REACT_POST', '2026-09-15 14:05:16', 'WEB', '{"post_id": 5, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (36, 13, 'REACT_POST', '2026-09-15 14:05:18', 'WEB', '{"post_id": 5, "action": "updated", "type": "FIRE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (37, 13, 'REACT_POST', '2026-09-15 14:05:18', 'WEB', '{"post_id": 5, "action": "removed", "type": "FIRE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (38, 13, 'REACT_POST', '2026-09-15 14:05:19', 'WEB', '{"post_id": 5, "action": "added", "type": "LOVE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (39, 13, 'REACT_POST', '2026-09-15 14:05:21', 'WEB', '{"post_id": 5, "action": "removed", "type": "LOVE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (40, 13, 'REACT_POST', '2026-09-15 14:05:21', 'WEB', '{"post_id": 5, "action": "updated", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (41, 13, 'REACT_POST', '2026-09-15 14:11:02', 'WEB', '{"post_id": 3, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (42, 13, 'REACT_POST', '2026-09-15 14:11:03', 'WEB', '{"post_id": 3, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (43, 13, 'REACT_POST', '2026-09-15 14:11:04', 'WEB', '{"post_id": 3, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (44, 13, 'FOLLOW', '2026-09-15 14:11:34', 'WEB', '{"target_user_id": 11, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (45, 13, 'REACT_POST', '2026-09-15 14:16:48', 'WEB', '{"post_id": 3, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (46, 15, 'LOGIN', '2026-09-15 14:23:47', 'WEB', '{"username": "Ritvik", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (47, 16, 'LOGIN', '2026-09-15 14:24:04', 'WEB', '{"username": "Shivansh", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (48, 17, 'LOGIN', '2026-09-15 14:24:04', 'WEB', '{"username": "Akshat", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (49, 18, 'LOGIN', '2026-09-15 14:24:04', 'WEB', '{"username": "Likitha", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (50, 19, 'LOGIN', '2026-09-15 14:24:04', 'WEB', '{"username": "Ridhima", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (51, 5, 'LOGIN', '2026-09-15 14:30:46', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (53, 2, 'FOLLOW', '2026-09-15 14:30:46', 'WEB', '{"target_user_id": 20, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (54, 2, 'UNFOLLOW', '2026-09-15 14:30:46', 'WEB', '{"target_user_id": 20, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (55, 5, 'LOGIN', '2026-09-15 14:57:02', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (57, 2, 'FOLLOW', '2026-09-15 14:57:02', 'WEB', '{"target_user_id": 21, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (58, 2, 'UNFOLLOW', '2026-09-15 14:57:02', 'WEB', '{"target_user_id": 21, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (59, 13, 'COMMENT_POST', '2026-09-15 14:59:11', 'WEB', '{"post_id": 2, "comment_id": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (60, 5, 'LOGIN', '2026-09-15 15:20:59', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (62, 2, 'FOLLOW', '2026-09-15 15:20:59', 'WEB', '{"target_user_id": 22, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (63, 2, 'UNFOLLOW', '2026-09-15 15:20:59', 'WEB', '{"target_user_id": 22, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (64, 5, 'LOGIN', '2026-09-15 21:44:50', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (65, 20, 'REGISTER', '2026-09-15 21:44:50', 'WEB', '{"username": "dev_1789488890", "email": "dev_1789488890@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (66, 2, 'FOLLOW', '2026-09-15 21:44:50', 'WEB', '{"target_user_id": 20, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (67, 2, 'UNFOLLOW', '2026-09-15 21:44:50', 'WEB', '{"target_user_id": 20, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (68, 5, 'LOGIN', '2026-09-15 21:45:22', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (69, 21, 'REGISTER', '2026-09-15 21:45:22', 'WEB', '{"username": "dev_1789488922", "email": "dev_1789488922@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (70, 2, 'FOLLOW', '2026-09-15 21:45:22', 'WEB', '{"target_user_id": 21, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (71, 2, 'UNFOLLOW', '2026-09-15 21:45:22', 'WEB', '{"target_user_id": 21, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (72, 5, 'LOGIN', '2026-09-15 21:45:28', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (73, 22, 'REGISTER', '2026-09-15 21:45:28', 'WEB', '{"username": "dev_1789488928", "email": "dev_1789488928@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (74, 2, 'FOLLOW', '2026-09-15 21:45:28', 'WEB', '{"target_user_id": 22, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (75, 2, 'UNFOLLOW', '2026-09-15 21:45:28', 'WEB', '{"target_user_id": 22, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (76, 5, 'LOGIN', '2026-09-15 21:45:34', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (77, 23, 'REGISTER', '2026-09-15 21:45:34', 'WEB', '{"username": "dev_1789488934", "email": "dev_1789488934@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (78, 2, 'FOLLOW', '2026-09-15 21:45:34', 'WEB', '{"target_user_id": 23, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (79, 2, 'UNFOLLOW', '2026-09-15 21:45:34', 'WEB', '{"target_user_id": 23, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (80, 5, 'LOGIN', '2026-09-15 21:47:54', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (81, 24, 'REGISTER', '2026-09-15 21:47:55', 'WEB', '{"username": "dev_1789489075", "email": "dev_1789489075@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (82, 2, 'FOLLOW', '2026-09-15 21:47:55', 'WEB', '{"target_user_id": 24, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (83, 2, 'UNFOLLOW', '2026-09-15 21:47:55', 'WEB', '{"target_user_id": 24, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (84, 5, 'LOGIN', '2026-09-15 21:49:15', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (85, 25, 'REGISTER', '2026-09-15 21:49:16', 'WEB', '{"username": "dev_1789489156", "email": "dev_1789489156@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (86, 2, 'FOLLOW', '2026-09-15 21:49:16', 'WEB', '{"target_user_id": 25, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (87, 2, 'UNFOLLOW', '2026-09-15 21:49:16', 'WEB', '{"target_user_id": 25, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (88, 5, 'LOGIN', '2026-09-15 21:49:30', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (89, 26, 'REGISTER', '2026-09-15 21:49:30', 'WEB', '{"username": "dev_1789489170", "email": "dev_1789489170@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (90, 2, 'FOLLOW', '2026-09-15 21:49:30', 'WEB', '{"target_user_id": 26, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (91, 2, 'UNFOLLOW', '2026-09-15 21:49:30', 'WEB', '{"target_user_id": 26, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (92, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (93, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (94, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (95, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (96, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (97, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (98, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (99, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (100, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (101, 2, 'REACT_POST', '2026-09-15 21:50:43', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (102, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 3}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (103, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (104, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 5}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (105, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 6}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (106, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 7}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (107, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 8}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (108, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 9}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (109, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 10}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (110, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 11}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (111, 1, 'SEND_MESSAGE', '2026-09-15 21:50:43', 'WEB', '{"receiver_id": 2, "message_id": 12}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (112, 1, 'POST_CREATE', '2026-09-15 21:50:43', 'WEB', '{"post_id": 6, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (113, 1, 'POST_CREATE', '2026-09-15 21:50:43', 'WEB', '{"post_id": 7, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (114, 1, 'POST_CREATE', '2026-09-15 21:50:43', 'WEB', '{"post_id": 8, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (115, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 9, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (116, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 10, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (117, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 11, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (118, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 12, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (119, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 13, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (120, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 14, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (121, 1, 'POST_CREATE', '2026-09-15 21:50:44', 'WEB', '{"post_id": 15, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (122, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (123, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (124, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (125, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (126, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (127, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (128, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (129, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (130, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (131, 2, 'REACT_POST', '2026-09-15 21:50:45', 'WEB', '{"post_id": 1, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (132, 1, 'SEND_MESSAGE', '2026-09-15 21:50:45', 'WEB', '{"receiver_id": 2, "message_id": 13}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (133, 1, 'SEND_MESSAGE', '2026-09-15 21:50:45', 'WEB', '{"receiver_id": 2, "message_id": 14}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (134, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 15}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (135, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 16}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (136, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 17}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (137, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 18}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (138, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 19}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (139, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 20}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (140, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 21}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (141, 1, 'SEND_MESSAGE', '2026-09-15 21:50:46', 'WEB', '{"receiver_id": 2, "message_id": 22}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (142, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 16, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (143, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 17, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (144, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 18, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (145, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 19, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (146, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 20, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (147, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 21, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (148, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 22, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (149, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 23, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (150, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 24, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (151, 1, 'POST_CREATE', '2026-09-15 21:50:46', 'WEB', '{"post_id": 25, "tags_count": 4}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (152, 1, 'REACT_POST', '2026-09-15 21:57:06', 'WEB', '{"post_id": 1, "action": "added", "type": "LOVE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (153, 1, 'SEND_MESSAGE', '2026-09-15 21:57:06', 'WEB', '{"receiver_id": 2, "message_id": 23}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (154, 1, 'POST_CREATE', '2026-09-15 21:57:06', 'WEB', '{"post_id": 26, "tags_count": 3}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (155, 13, 'LOGIN', '2026-09-15 22:02:24', 'WEB', '{"username": "rajarshi10", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (156, 13, 'REACT_POST', '2026-09-15 22:06:06', 'WEB', '{"post_id": 26, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (157, 13, 'REACT_POST', '2026-09-15 22:06:08', 'WEB', '{"post_id": 25, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (158, 13, 'LOGOUT', '2026-09-15 22:13:36', 'WEB', '{"status": "LOGGED_OUT"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (159, 5, 'LOGIN', '2026-09-15 22:13:54', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (160, 5, 'LOGOUT', '2026-09-15 22:16:30', 'WEB', '{"status": "LOGGED_OUT"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (161, 13, 'LOGIN', '2026-09-15 22:16:44', 'WEB', '{"username": "rajarshi10", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (162, 13, 'LOGOUT', '2026-09-15 22:20:56', 'WEB', '{"status": "LOGGED_OUT"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (163, 5, 'LOGIN', '2026-09-15 22:20:58', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (164, 27, 'REGISTER', '2026-09-15 22:20:58', 'WEB', '{"username": "dev_1789491058", "email": "dev_1789491058@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (165, 2, 'FOLLOW', '2026-09-15 22:20:58', 'WEB', '{"target_user_id": 27, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (166, 2, 'UNFOLLOW', '2026-09-15 22:20:58', 'WEB', '{"target_user_id": 27, "action": "UNFOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (167, 13, 'LOGIN', '2026-09-15 22:21:32', 'WEB', '{"username": "rajarshi10", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (168, 13, 'LOGOUT', '2026-09-15 22:21:46', 'WEB', '{"status": "LOGGED_OUT"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (169, 5, 'LOGIN', '2026-09-15 22:21:57', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (170, 5, 'REACT_POST', '2026-09-15 22:26:46', 'WEB', '{"post_id": 10, "action": "updated", "type": "LOVE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (171, 5, 'REACT_POST', '2026-09-15 22:26:47', 'WEB', '{"post_id": 10, "action": "removed", "type": "LOVE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (172, 5, 'REACT_POST', '2026-09-15 22:26:48', 'WEB', '{"post_id": 10, "action": "added", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (173, 5, 'REACT_POST', '2026-09-15 22:26:50', 'WEB', '{"post_id": 10, "action": "removed", "type": "LIKE"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (174, 5, 'LOGIN', '2026-09-15 22:28:33', 'WEB', '{"username": "rajarshi", "status": "SUCCESS"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (175, 28, 'REGISTER', '2026-09-15 22:28:33', 'WEB', '{"username": "dev_1789491513", "email": "dev_1789491513@socialsphere.io", "status": "CREATED"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (176, 2, 'FOLLOW', '2026-09-15 22:28:33', 'WEB', '{"target_user_id": 28, "action": "FOLLOW"}');
INSERT INTO `Event_Analysis` (`event_id`, `user_id`, `event_type`, `event_time`, `device_type`, `metadata`) VALUES (177, 2, 'UNFOLLOW', '2026-09-15 22:28:33', 'WEB', '{"target_user_id": 28, "action": "UNFOLLOW"}');

-- Table: `User_Follow` (5 rows)
INSERT INTO `User_Follow` (`follow_id`, `follower_id`, `following_id`, `created_at`) VALUES (1, 2, 3, '2026-09-15 07:13:51');
INSERT INTO `User_Follow` (`follow_id`, `follower_id`, `following_id`, `created_at`) VALUES (2, 2, 4, '2026-09-15 07:13:51');
INSERT INTO `User_Follow` (`follow_id`, `follower_id`, `following_id`, `created_at`) VALUES (3, 3, 2, '2026-09-15 07:13:51');
INSERT INTO `User_Follow` (`follow_id`, `follower_id`, `following_id`, `created_at`) VALUES (4, 4, 2, '2026-09-15 07:13:51');
INSERT INTO `User_Follow` (`follow_id`, `follower_id`, `following_id`, `created_at`) VALUES (5, 4, 3, '2026-09-15 07:13:51');

SET FOREIGN_KEY_CHECKS = 1;
