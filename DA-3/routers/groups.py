import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Query, Depends
from db import query_all, query_one, execute_write
from auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/groups",
    tags=["Community Groups"]
)

class CreateGroupRequest(BaseModel):
    group_name: str
    description: Optional[str] = None
    privacy_setting: Optional[str] = "PUBLIC"
    user_id: Optional[int] = None  # Deprecated: Derived strictly from auth token

class JoinGroupRequest(BaseModel):
    user_id: Optional[int] = None  # Deprecated: Derived strictly from auth token

@router.get("")
def list_groups(
    user_id: Optional[int] = Query(None, description="Deprecated user param"),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """List all community groups with membership details."""
    try:
        active_user_id = current_user["user_id"] if current_user else user_id

        sql = """
            SELECT 
                cg.group_id,
                cg.group_name,
                cg.description,
                cg.created_date,
                cg.privacy_setting,
                COUNT(gm.user_id) AS member_count
            FROM Community_Group cg
            LEFT JOIN Group_Members gm ON gm.group_id = cg.group_id
            GROUP BY cg.group_id
            ORDER BY cg.group_id ASC
        """
        groups = query_all(sql)

        for g in groups:
            group_id = g["group_id"]
            # Fetch group members
            members = query_all("""
                SELECT 
                    u.user_id,
                    u.username,
                    pp.image_url AS profile_pic,
                    gm.role,
                    gm.join_date
                FROM Group_Members gm
                JOIN Users u ON u.user_id = gm.user_id
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                WHERE gm.group_id = ?
                ORDER BY gm.join_date ASC
            """, (group_id,))
            g["members"] = members
            g["is_member"] = any(m["user_id"] == active_user_id for m in members) if active_user_id else False

        return {
            "success": True,
            "count": len(groups),
            "groups": groups
        }
    except Exception as e:
        logger.error(f"Error fetching groups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_group(
    payload: CreateGroupRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new community group and assign creator as ADMIN (creator derived from token)."""
    try:
        user_id = current_user["user_id"]
        group_id = execute_write("""
            INSERT INTO Community_Group (group_name, description, privacy_setting)
            VALUES (?, ?, ?)
        """, (payload.group_name, payload.description, payload.privacy_setting))

        # Add creator as ADMIN in Group_Members
        execute_write("""
            INSERT INTO Group_Members (group_id, user_id, role)
            VALUES (?, ?, 'ADMIN')
        """, (group_id, user_id))

        # Log event
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'GROUP_CREATE', 'WEB', ?)
        """, (user_id, f'{{"group_id": {group_id}, "group_name": "{payload.group_name}"}}'))

        return {
            "success": True,
            "message": "Community group created successfully",
            "group_id": group_id
        }
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{group_id}/toggle-join")
def toggle_group_membership(
    group_id: int = Path(..., description="Group ID"),
    payload: Optional[JoinGroupRequest] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Join or leave a community group. Actor derived strictly from verified JWT token."""
    try:
        user_id = current_user["user_id"]
        existing = query_one("""
            SELECT role FROM Group_Members 
            WHERE group_id = ? AND user_id = ?
        """, (group_id, user_id))

        if existing:
            execute_write("""
                DELETE FROM Group_Members 
                WHERE group_id = ? AND user_id = ?
            """, (group_id, user_id))
            action = "left"
        else:
            execute_write("""
                INSERT INTO Group_Members (group_id, user_id, role)
                VALUES (?, ?, 'MEMBER')
            """, (group_id, user_id))
            action = "joined"

        return {
            "success": True,
            "action": action,
            "group_id": group_id,
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error toggling membership for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
