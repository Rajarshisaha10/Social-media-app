import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path
from db import query_all, query_one, execute_write

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/messages",
    tags=["Messages"]
)

class SendMessageRequest(BaseModel):
    sender_id: int
    receiver_id: int
    content: str

@router.get("/conversations/{user_id}")
def get_user_conversations(user_id: int = Path(..., description="Active User ID")):
    """Get list of active chat conversations for a given user."""
    try:
        # Fetch other users the active user has had messages with
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
                    "last_message": last_msg,
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

@router.get("/thread/{user_1}/{user_2}")
def get_message_thread(
    user_1: int = Path(..., description="First User ID"),
    user_2: int = Path(..., description="Second User ID")
):
    """Get full message thread history between two users."""
    try:
        sql = """
            SELECT 
                m.message_id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.sent_at,
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
def send_message(payload: SendMessageRequest):
    """Send a direct message to another user."""
    try:
        if not payload.content.strip():
            raise HTTPException(status_code=400, detail="Message content cannot be empty")

        if payload.sender_id == payload.receiver_id:
            raise HTTPException(status_code=400, detail="Cannot send message to yourself")

        message_id = execute_write("""
            INSERT INTO Message (sender_id, receiver_id, content, read_status)
            VALUES (?, ?, ?, 'UNREAD')
        """, (payload.sender_id, payload.receiver_id, payload.content.strip()))

        # Also create a notification for the recipient
        sender = query_one("SELECT username FROM Users WHERE user_id = ?", (payload.sender_id,))
        sender_name = sender["username"] if sender else "Someone"
        execute_write("""
            INSERT INTO Notification (recipient_id, content, ref_id, ref_type)
            VALUES (?, ?, ?, 'MESSAGE')
        """, (payload.receiver_id, f"{sender_name} sent you a message: {payload.content[:30]}...", message_id))

        # Log event
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'SEND_MESSAGE', 'WEB', ?)
        """, (payload.sender_id, f'{{"receiver_id": {payload.receiver_id}, "message_id": {message_id}}}'))

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
