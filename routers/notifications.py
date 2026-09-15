import logging
from fastapi import APIRouter, HTTPException, Path
from db import query_all, execute_write

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("/{user_id}")
def get_user_notifications(user_id: int = Path(..., description="User ID")):
    """Get notifications for a user."""
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
def delete_notification(notification_id: int = Path(..., description="Notification ID")):
    """Dismiss a single notification."""
    try:
        execute_write("DELETE FROM Notification WHERE notification_id = ?", (notification_id,))
        return {
            "success": True,
            "message": f"Notification {notification_id} removed"
        }
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
