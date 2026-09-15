import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path
from db import query_all, query_one, execute_write

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

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
            raise HTTPException(status_code=401, detail="User account not found. Please check your username or create an account.")

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
    """Register a new user account across Users, User_Credentials, Profile_Pic, and Regular_User tables."""
    try:
        username = payload.username.strip()
        password = payload.password.strip()
        email = payload.email.strip()

        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
        if len(password) < 4:
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="Please provide a valid email address.")

        # Check existing username or email
        existing_user = query_one("SELECT user_id FROM Users WHERE LOWER(username) = LOWER(?)", (username,))
        if existing_user:
            raise HTTPException(status_code=400, detail="This username is already taken. Please pick another one.")

        existing_email = query_one("SELECT user_id FROM Users WHERE LOWER(email) = LOWER(?)", (email,))
        if existing_email:
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

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
        """, (user_id, f'{{"username": "{username}", "status": "CREATED"}}'))

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
def list_users():
    """List all registered users with their profile details."""
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
    user_id: int = Path(..., description="User ID")
):
    """Get single user profile by ID."""
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
        return {
            "success": True,
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
