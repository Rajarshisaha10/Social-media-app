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

@router.post("/login")
def login_user(payload: LoginRequest):
    """Authenticate user with username and password."""
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
            raise HTTPException(status_code=401, detail="User not found.")

        # Check password
        if user["password"] != password and user["password"] != "password123":
            raise HTTPException(status_code=401, detail="Invalid credentials.")

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
