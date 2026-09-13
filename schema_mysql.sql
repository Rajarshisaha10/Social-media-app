-- =======================================================
-- MySQL Database Schema for Social Media Analytics
-- =======================================================

CREATE DATABASE IF NOT EXISTS social_media_db;
USE social_media_db;

-- 1. User table
CREATE TABLE IF NOT EXISTS user (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    DOB DATE,
    Bio TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Post table
CREATE TABLE IF NOT EXISTS post (
    PostID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Content TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- 3. Comment table
CREATE TABLE IF NOT EXISTS comment (
    CommentID INT AUTO_INCREMENT PRIMARY KEY,
    PostID INT,
    UserID INT,
    CommentText TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PostID) REFERENCES post(PostID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- 4. Reaction table
CREATE TABLE IF NOT EXISTS reaction (
    ReactionID INT AUTO_INCREMENT PRIMARY KEY,
    PostID INT,
    UserID INT,
    ReactionType VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PostID) REFERENCES post(PostID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- 5. Message table
CREATE TABLE IF NOT EXISTS message (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    SenderID INT,
    ReceiverID INT,
    MessageText TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SenderID) REFERENCES user(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ReceiverID) REFERENCES user(UserID) ON DELETE CASCADE
);

-- 6. Community Group table
CREATE TABLE IF NOT EXISTS community_group (
    GroupID INT AUTO_INCREMENT PRIMARY KEY,
    GroupName VARCHAR(150) NOT NULL,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Friend Recommendation table
CREATE TABLE IF NOT EXISTS friend_recommendation (
    RecommendationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    RecommendedUserID INT,
    Score DECIMAL(5, 2),
    GeneratedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES user(UserID) ON DELETE CASCADE,
    FOREIGN KEY (RecommendedUserID) REFERENCES user(UserID) ON DELETE CASCADE
);
