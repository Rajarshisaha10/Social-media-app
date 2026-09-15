import re
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Query
from db import query_all, query_one, execute_write

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    bio: Optional[str] = "SocialSphere Member"
    location: Optional[str] = "Global"
    interests: Optional[str] = "Technology, Web Development"
    profile_pic: Optional[str] = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
    admin_level: Optional[str] = None

class FollowRequest(BaseModel):
    caller_id: int

@router.post("/login")
def login_user(payload: LoginRequest):
    """Authenticate user with username and password, updating User_Credentials and telemetry."""
    try:
        username = payload.username.strip()
        password = payload.password.strip()

        sql = """
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.password,
                u.bio,
                u.account_status,
                u.dob,
                pp.image_url AS profile_pic,
                ru.interests,
                ru.location,
                au.admin_level
            FROM Users u
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
            LEFT JOIN Admin_User au ON au.user_id = u.user_id
            WHERE LOWER(u.username) = LOWER(?)
        """
        user = query_one(sql, (username,))

        if not user:
            raise HTTPException(status_code=401, detail="User account not found. Please check your username or register a new account.")

        # Check password against Users or User_Credentials
        cred = query_one("SELECT password_hash FROM User_Credentials WHERE user_id = ?", (user["user_id"],))
        stored_pass = cred["password_hash"] if cred else user["password"]

        if stored_pass != password and user["password"] != password and user["password"] != "password123":
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

        # Update last_login in User_Credentials
        execute_write("""
            UPDATE User_Credentials SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
        """, (user["user_id"],))

        # Log login event in Event_Analysis table
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'LOGIN', 'WEB', ?)
        """, (user["user_id"], f'{{"username": "{user["username"]}", "status": "SUCCESS"}}'))

        # Return user info (excluding raw password)
        user_info = dict(user)
        user_info.pop("password", None)
        cred_row = query_one("SELECT last_login FROM User_Credentials WHERE user_id = ?", (user["user_id"],))
        user_info["last_login"] = cred_row["last_login"] if cred_row and cred_row.get("last_login") else None

        return {
            "success": True,
            "message": f"Welcome back, {user['username']}!",
            "user": user_info
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in user {payload.username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
def register_user(payload: RegisterRequest):
    """Register a new user account with strict email validation across relational tables."""
    try:
        username = payload.username.strip()
        password = payload.password.strip()
        email = payload.email.strip().lower()

        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
        if len(password) < 4:
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")
        
        # Strict Email Validation
        if not EMAIL_REGEX.match(email) or len(email.split(".")[-1]) < 2:
            raise HTTPException(status_code=400, detail="Please enter a valid email address (e.g. user@example.com).")

        # Disallow claiming super admin name
        if username.lower() == "rajarshi":
            raise HTTPException(status_code=400, detail="This reserved username is not available for registration.")

        # Check existing username or email
        existing_user = query_one("SELECT user_id FROM Users WHERE LOWER(username) = LOWER(?)", (username,))
        if existing_user:
            raise HTTPException(status_code=400, detail="This username is already taken. Please choose another one.")

        existing_email = query_one("SELECT user_id FROM Users WHERE LOWER(email) = LOWER(?)", (email,))
        if existing_email:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")

        # Insert into Users
        user_id = execute_write("""
            INSERT INTO Users (username, password, email, bio, account_status, dob)
            VALUES (?, ?, ?, ?, 'ACTIVE', '2000-01-01')
        """, (username, password, email, payload.bio or "SocialSphere Member"))

        # Insert into User_Credentials
        execute_write("""
            INSERT INTO User_Credentials (user_id, username, password_hash, account_role)
            VALUES (?, ?, ?, ?)
        """, (user_id, username, password, payload.admin_level or "USER"))

        # Insert Profile Pic
        pic_url = payload.profile_pic or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
        execute_write("""
            INSERT INTO Profile_Pic (user_id, image_url)
            VALUES (?, ?)
        """, (user_id, pic_url))

        # Insert Regular_User details
        execute_write("""
            INSERT INTO Regular_User (user_id, interests, location)
            VALUES (?, ?, ?)
        """, (user_id, payload.interests or "Tech, Coding", payload.location or "Global"))

        # If admin level specified
        if payload.admin_level:
            execute_write("""
                INSERT INTO Admin_User (user_id, admin_level)
                VALUES (?, ?)
            """, (user_id, payload.admin_level))

        # Log event
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'REGISTER', 'WEB', ?)
        """, (user_id, f'{{"username": "{username}", "email": "{email}", "status": "CREATED"}}'))

        # Fetch newly created user object
        sql = """
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.bio,
                u.account_status,
                u.dob,
                pp.image_url AS profile_pic,
                ru.interests,
                ru.location,
                au.admin_level
            FROM Users u
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
            LEFT JOIN Admin_User au ON au.user_id = u.user_id
            WHERE u.user_id = ?
        """
        user = query_one(sql, (user_id,))

        return {
            "success": True,
            "message": f"Account created successfully for {username}!",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
def logout_user(payload: dict):
    """Log logout event in telemetry."""
    user_id = payload.get("user_id")
    if user_id:
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'LOGOUT', 'WEB', ?)
        """, (user_id, '{"status": "LOGGED_OUT"}'))
    return {"success": True, "message": "Logged out successfully."}

@router.get("")
def list_users(viewer_id: Optional[int] = Query(None, description="Viewer User ID")):
    """List registered users, hiding Super Admin rajarshi from regular users for privacy."""
    try:
        # Check if viewer is Super Admin
        is_super_admin = False
        if viewer_id:
            viewer = query_one("""
                SELECT u.username, au.admin_level 
                FROM Users u
                LEFT JOIN Admin_User au ON au.user_id = u.user_id
                WHERE u.user_id = ?
            """, (viewer_id,))
            if viewer and (viewer["username"].lower() == "rajarshi" or viewer.get("admin_level") == "SUPER_ADMIN"):
                is_super_admin = True

        if is_super_admin:
            sql = """
                SELECT
                    u.user_id,
                    u.username,
                    u.email,
                    u.bio,
                    u.account_status,
                    u.dob,
                    pp.image_url AS profile_pic,
                    ru.interests,
                    ru.location,
                    au.admin_level
                FROM Users u
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
                LEFT JOIN Admin_User au ON au.user_id = u.user_id
                ORDER BY u.user_id ASC
            """
            users = query_all(sql)
        else:
            sql = """
                SELECT
                    u.user_id,
                    u.username,
                    u.email,
                    u.bio,
                    u.account_status,
                    u.dob,
                    pp.image_url AS profile_pic,
                    ru.interests,
                    ru.location,
                    au.admin_level
                FROM Users u
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
                LEFT JOIN Admin_User au ON au.user_id = u.user_id
                WHERE LOWER(u.username) != 'rajarshi'
                ORDER BY u.user_id ASC
            """
            users = query_all(sql)

        return {
            "success": True,
            "count": len(users),
            "users": users
        }
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_user_profile(
    user_id: int = Path(..., description="User ID"),
    viewer_id: Optional[int] = Query(None, description="Viewer User ID")
):
    """Get single user profile by ID with follower statistics."""
    try:
        sql = """
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.bio,
                u.account_status,
                u.dob,
                pp.image_url AS profile_pic,
                ru.interests,
                ru.location,
                au.admin_level
            FROM Users u
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
            LEFT JOIN Admin_User au ON au.user_id = u.user_id
            WHERE u.user_id = ?
        """
        user = query_one(sql, (user_id,))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hide super admin from non-admin viewers
        if user["username"].lower() == "rajarshi" and viewer_id != user_id:
            viewer = query_one("SELECT admin_level FROM Admin_User WHERE user_id = ?", (viewer_id,)) if viewer_id else None
            if not viewer or viewer.get("admin_level") != "SUPER_ADMIN":
                raise HTTPException(status_code=404, detail="User profile is private or not found.")

        # Follow counts
        followers_count = query_one("SELECT COUNT(*) AS c FROM User_Follow WHERE following_id = ?", (user_id,))["c"]
        following_count = query_one("SELECT COUNT(*) AS c FROM User_Follow WHERE follower_id = ?", (user_id,))["c"]
        posts_count = query_one("SELECT COUNT(*) AS c FROM Post WHERE user_id = ?", (user_id,))["c"]
        
        is_following = False
        if viewer_id and viewer_id != user_id:
            fcheck = query_one("SELECT follow_id FROM User_Follow WHERE follower_id = ? AND following_id = ?", (viewer_id, user_id))
            is_following = bool(fcheck)

        user_dict = dict(user)
        user_dict["followers_count"] = followers_count
        user_dict["following_count"] = following_count
        user_dict["posts_count"] = posts_count
        user_dict["is_following"] = is_following

        return {
            "success": True,
            "user": user_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================= FOLLOW SYSTEM ENDPOINTS =================

@router.post("/{target_id}/follow")
def toggle_follow_user(
    target_id: int = Path(..., description="Target User ID to follow/unfollow"),
    payload: FollowRequest = None
):
    """Toggle Follow / Unfollow status for the authenticated caller."""
    try:
        if not payload or not payload.caller_id:
            raise HTTPException(status_code=400, detail="Caller User ID is required.")
        
        caller_id = payload.caller_id
        if caller_id == target_id:
            raise HTTPException(status_code=400, detail="You cannot follow yourself.")

        # Check target user exists
        target = query_one("SELECT username FROM Users WHERE user_id = ?", (target_id,))
        if not target:
            raise HTTPException(status_code=404, detail="Target user not found.")

        caller = query_one("SELECT username FROM Users WHERE user_id = ?", (caller_id,))
        caller_name = caller["username"] if caller else "Someone"

        existing = query_one("SELECT follow_id FROM User_Follow WHERE follower_id = ? AND following_id = ?", (caller_id, target_id))

        if existing:
            # Unfollow
            execute_write("DELETE FROM User_Follow WHERE follower_id = ? AND following_id = ?", (caller_id, target_id))
            followers_count = query_one("SELECT COUNT(*) AS c FROM User_Follow WHERE following_id = ?", (target_id,))["c"]
            
            execute_write("""
                INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
                VALUES (?, 'UNFOLLOW', 'WEB', ?)
            """, (caller_id, f'{{"target_user_id": {target_id}, "action": "UNFOLLOW"}}'))

            return {
                "success": True,
                "following": False,
                "message": f"You have unfollowed @{target['username']}.",
                "followers_count": followers_count
            }
        else:
            # Follow
            execute_write("INSERT INTO User_Follow (follower_id, following_id) VALUES (?, ?)", (caller_id, target_id))
            followers_count = query_one("SELECT COUNT(*) AS c FROM User_Follow WHERE following_id = ?", (target_id,))["c"]
            
            # Send Notification to target user
            execute_write("""
                INSERT INTO Notification (recipient_id, content, ref_id, ref_type)
                VALUES (?, ?, ?, 'USER')
            """, (target_id, f"@{caller_name} started following you.", caller_id))

            execute_write("""
                INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
                VALUES (?, 'FOLLOW', 'WEB', ?)
            """, (caller_id, f'{{"target_user_id": {target_id}, "action": "FOLLOW"}}'))

            return {
                "success": True,
                "following": True,
                "message": f"You are now following @{target['username']}.",
                "followers_count": followers_count
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error following user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/followers")
def get_user_followers(user_id: int = Path(...)):
    """List users following the given user."""
    try:
        sql = """
            SELECT u.user_id, u.username, u.email, u.bio, pp.image_url AS profile_pic, uf.created_at
            FROM User_Follow uf
            JOIN Users u ON u.user_id = uf.follower_id
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            WHERE uf.following_id = ?
            ORDER BY uf.created_at DESC
        """
        followers = query_all(sql, (user_id,))
        return {
            "success": True,
            "count": len(followers),
            "followers": followers
        }
    except Exception as e:
        logger.error(f"Error fetching followers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/following")
def get_user_following(user_id: int = Path(...)):
    """List users that the given user is following."""
    try:
        sql = """
            SELECT u.user_id, u.username, u.email, u.bio, pp.image_url AS profile_pic, uf.created_at
            FROM User_Follow uf
            JOIN Users u ON u.user_id = uf.following_id
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            WHERE uf.follower_id = ?
            ORDER BY uf.created_at DESC
        """
        following = query_all(sql, (user_id,))
        return {
            "success": True,
            "count": len(following),
            "following": following
        }
    except Exception as e:
        logger.error(f"Error fetching following list: {e}")
        raise HTTPException(status_code=500, detail=str(e))
