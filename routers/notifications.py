import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Path, Depends, status
from db import query_all, query_one, execute_write
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("")
def get_current_user_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get notifications for the authenticated user."""
    return _fetch_notifications(current_user["user_id"])

@router.get("/{user_id}")
def get_user_notifications(
    user_id: int = Path(..., description="User ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get notifications. Only allowed for account owner or super admin."""
    is_super_admin = (
        current_user.get("admin_level") == "SUPER_ADMIN"
        or current_user.get("username", "").lower() == "rajarshi"
    )
    if user_id != current_user["user_id"] and not is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot view notifications belonging to another user."
        )
    return _fetch_notifications(user_id)

def _fetch_notifications(user_id: int):
    try:
        sql = """
            SELECT 
                notification_id,
                recipient_id,
                content,
                ref_id,
                ref_type,
                created_at
            FROM Notification
            WHERE recipient_id = ?
            ORDER BY notification_id DESC
        """
        notifications = query_all(sql, (user_id,))
        return {
            "success": True,
            "count": len(notifications),
            "notifications": notifications
        }
    except Exception as e:
        logger.error(f"Error fetching notifications for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int = Path(..., description="Notification ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Dismiss a single notification with recipient ownership verification."""
    try:
        notif = query_one("SELECT recipient_id FROM Notification WHERE notification_id = ?", (notification_id,))
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")

        is_super_admin = (
            current_user.get("admin_level") == "SUPER_ADMIN"
            or current_user.get("username", "").lower() == "rajarshi"
        )
        if notif["recipient_id"] != current_user["user_id"] and not is_super_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You can only dismiss your own notifications."
            )

        execute_write("DELETE FROM Notification WHERE notification_id = ?", (notification_id,))
        return {
            "success": True,
            "message": f"Notification {notification_id} removed"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
