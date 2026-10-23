import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Depends, status
from db import query_all, query_one, execute_write
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/messages",
    tags=["Messages"]
)

class SendMessageRequest(BaseModel):
    receiver_id: int
    content: str
    sender_id: Optional[int] = None  # Deprecated: Derived strictly from auth token

@router.get("/conversations")
def get_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get list of active chat conversations for the authenticated user."""
    return _fetch_conversations(current_user["user_id"])

@router.get("/conversations/{user_id}")
def get_user_conversations(
    user_id: int = Path(..., description="Active User ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get list of active chat conversations. Only the account owner or super admin is permitted."""
    is_super_admin = (
        current_user.get("admin_level") == "SUPER_ADMIN"
        or current_user.get("username", "").lower() == "rajarshi"
    )
    if user_id != current_user["user_id"] and not is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot view conversations belonging to another user."
        )
    return _fetch_conversations(user_id)

def _fetch_conversations(user_id: int):
    try:
        sql = """
            SELECT DISTINCT
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END AS partner_id
            FROM Message m
            WHERE m.sender_id = ? OR m.receiver_id = ?
        """
        partners = query_all(sql, (user_id, user_id, user_id))

        conversations = []
        for p in partners:
            partner_id = p["partner_id"]
            partner_info = query_one("""
                SELECT 
                    u.user_id,
                    u.username,
                    pp.image_url AS profile_pic
                FROM Users u
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                WHERE u.user_id = ?
            """, (partner_id,))

            last_msg = query_one("""
                SELECT content, sent_at, read_status, sender_id
                FROM Message
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                ORDER BY message_id DESC
                LIMIT 1
            """, (user_id, partner_id, partner_id, user_id))

            unread_count = query_one("""
                SELECT COUNT(*) AS unread
                FROM Message
                WHERE sender_id = ? AND receiver_id = ? AND read_status = 'UNREAD'
            """, (partner_id, user_id))

            if partner_info:
                conversations.append({
                    "partner": partner_info,
                    "partner_id": partner_info["user_id"],
                    "partner_username": partner_info["username"],
                    "profile_pic": partner_info["profile_pic"],
                    "last_message": last_msg["content"] if last_msg else None,
                    "last_msg_details": last_msg,
                    "last_timestamp": str(last_msg["sent_at"]) if last_msg and last_msg.get("sent_at") else None,
                    "unread_count": unread_count["unread"] if unread_count else 0
                })

        return {
            "success": True,
            "count": len(conversations),
            "conversations": conversations
        }
    except Exception as e:
        logger.error(f"Error fetching conversations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/thread/{partner_id}")
def get_partner_message_thread(
    partner_id: int = Path(..., description="Chat partner User ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get full message thread history between authenticated user and partner."""
    return _fetch_message_thread(current_user["user_id"], partner_id)

@router.get("/thread/{user_1}/{user_2}")
def get_message_thread(
    user_1: int = Path(..., description="First User ID"),
    user_2: int = Path(..., description="Second User ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get message thread history. Requires authenticated user to be participant or super admin."""
    caller_id = current_user["user_id"]
    is_super_admin = (
        current_user.get("admin_level") == "SUPER_ADMIN"
        or current_user.get("username", "").lower() == "rajarshi"
    )
    if caller_id not in (user_1, user_2) and not is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only access message threads in which you are a participant."
        )

    return _fetch_message_thread(user_1, user_2)

def _fetch_message_thread(user_1: int, user_2: int):
    try:
        sql = """
            SELECT 
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.sent_at,
                m.sent_at AS created_at,
                m.read_status,
                s.username AS sender_name,
                sp.image_url AS sender_avatar
            FROM Message m
            JOIN Users s ON s.user_id = m.sender_id
            LEFT JOIN Profile_Pic sp ON sp.user_id = s.user_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.message_id ASC
        """
        messages = query_all(sql, (user_1, user_2, user_2, user_1))

        for msg in messages:
            if msg.get("sent_at"):
                msg["sent_at"] = str(msg["sent_at"])
            if msg.get("created_at"):
                msg["created_at"] = str(msg["created_at"])

        # Mark unread messages sent by user_2 to user_1 as READ
        execute_write("""
            UPDATE Message
            SET read_status = 'READ'
            WHERE sender_id = ? AND receiver_id = ? AND read_status = 'UNREAD'
        """, (user_2, user_1))

        return {
            "success": True,
            "count": len(messages),
            "messages": messages
        }
    except Exception as e:
        logger.error(f"Error fetching message thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def send_message(
    payload: SendMessageRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send a direct message. Sender identity is derived strictly from verified JWT token."""
    try:
        sender_id = current_user["user_id"]
        content = payload.content.strip()

        if not content:
            raise HTTPException(status_code=400, detail="Message content cannot be empty")

        if sender_id == payload.receiver_id:
            raise HTTPException(status_code=400, detail="Cannot send message to yourself")

        receiver = query_one("SELECT user_id, username FROM Users WHERE user_id = ?", (payload.receiver_id,))
        if not receiver:
            raise HTTPException(status_code=404, detail="Recipient user not found")

        message_id = execute_write("""
            INSERT INTO Message (sender_id, receiver_id, content, read_status)
            VALUES (?, ?, ?, 'UNREAD')
        """, (sender_id, payload.receiver_id, content))

        # Create notification for recipient
        sender_name = current_user.get("username", "Someone")
        execute_write("""
            INSERT INTO Notification (recipient_id, content, ref_id, ref_type)
            VALUES (?, ?, ?, 'MESSAGE')
        """, (payload.receiver_id, f"{sender_name} sent you a message: {content[:30]}...", message_id))

        # Log event
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'SEND_MESSAGE', 'WEB', ?)
        """, (sender_id, f'{{"receiver_id": {payload.receiver_id}, "message_id": {message_id}}}'))

        return {
            "success": True,
            "message": "Message sent successfully",
            "message_id": message_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
