import re
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Query
from db import query_all, query_one, execute_write

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/posts",
    tags=["Posts"]
)

class CreatePostRequest(BaseModel):
    user_id: int
    content: str
    url: Optional[str] = None
    visibility: Optional[str] = "PUBLIC"

class ReactPostRequest(BaseModel):
    user_id: int
    reaction_type: str = "LIKE"

class CreateCommentRequest(BaseModel):
    user_id: int
    content: str
    reply_to: Optional[int] = None

@router.get("")
def list_posts(tag: Optional[str] = Query(None, description="Filter posts by hashtag")):
    """Get social media feed posts with author profiles, reaction counts, comments, and hashtags."""
    try:
        if tag:
            posts_sql = """
                SELECT DISTINCT
                    p.post_id,
                    p.user_id,
                    p.content,
                    p.created_date,
                    p.url,
                    p.visibility,
                    u.username,
                    pp.image_url AS profile_pic
                FROM Post p
                JOIN Users u ON u.user_id = p.user_id
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                JOIN Post_Hashtag ph ON ph.post_id = p.post_id
                JOIN Hashtag h ON h.hashtag_id = ph.hashtag_id
                WHERE h.tag = ?
                ORDER BY p.post_id DESC
            """
            posts = query_all(posts_sql, (tag.lstrip("#"),))
        else:
            posts_sql = """
                SELECT
                    p.post_id,
                    p.user_id,
                    p.content,
                    p.created_date,
                    p.url,
                    p.visibility,
                    u.username,
                    pp.image_url AS profile_pic
                FROM Post p
                JOIN Users u ON u.user_id = p.user_id
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                ORDER BY p.post_id DESC
            """
            posts = query_all(posts_sql)

        for post in posts:
            post_id = post["post_id"]
            # Fetch reactions with reaction_type breakdown
            reactions = query_all("""
                SELECT
                    r.reaction_id,
                    r.reaction_type,
                    r.user_id,
                    u.username
                FROM Reaction r
                JOIN Users u ON u.user_id = r.user_id
                WHERE r.post_id = ?
            """, (post_id,))
            post["reactions"] = reactions
            post["reaction_count"] = len(reactions)

            # Fetch comments
            comments = query_all("""
                SELECT
                    c.comment_id,
                    c.user_id,
                    c.reply_to,
                    c.content,
                    c.created_date,
                    u.username,
                    pp.image_url AS profile_pic
                FROM Comment c
                JOIN Users u ON u.user_id = c.user_id
                LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
                WHERE c.post_id = ?
                ORDER BY c.comment_id ASC
            """, (post_id,))
            post["comments"] = comments
            post["comment_count"] = len(comments)

            # Fetch hashtags
            hashtags = query_all("""
                SELECT h.tag, h.category
                FROM Post_Hashtag ph
                JOIN Hashtag h ON h.hashtag_id = ph.hashtag_id
                WHERE ph.post_id = ?
            """, (post_id,))
            post["hashtags"] = [h["tag"] for h in hashtags]

        return {
            "success": True,
            "filter_tag": tag,
            "count": len(posts),
            "posts": posts
        }
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_post(payload: CreatePostRequest):
    """Create a new post and automatically parse & link hashtags."""
    try:
        user = query_one("SELECT user_id, username FROM Users WHERE user_id = ?", (payload.user_id,))
        if not user:
            raise HTTPException(status_code=400, detail=f"User {payload.user_id} does not exist.")

        post_id = execute_write("""
            INSERT INTO Post (user_id, content, url, visibility)
            VALUES (?, ?, ?, ?)
        """, (payload.user_id, payload.content, payload.url, payload.visibility))

        # Extract hashtags from content (e.g. #python #tech)
        tags = set(re.findall(r'#([a-zA-Z0-9_]+)', payload.content))
        for tag in tags:
            tag_clean = tag.lower()
            existing_tag = query_one("SELECT hashtag_id FROM Hashtag WHERE tag = ?", (tag_clean,))
            if existing_tag:
                hashtag_id = existing_tag["hashtag_id"]
            else:
                hashtag_id = execute_write("""
                    INSERT INTO Hashtag (tag, category)
                    VALUES (?, 'General')
                """, (tag_clean,))

            execute_write("""
                INSERT IGNORE INTO Post_Hashtag (post_id, hashtag_id)
                VALUES (?, ?)
            """, (post_id, hashtag_id))

        # Log event in Event_Analysis
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'POST_CREATE', 'WEB', ?)
        """, (payload.user_id, f'{{"post_id": {post_id}, "tags_count": {len(tags)}}}'))

        return {
            "success": True,
            "message": "Post created successfully",
            "post_id": post_id,
            "hashtags": list(tags)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{post_id}/react")
def react_to_post(
    post_id: int = Path(...),
    payload: ReactPostRequest = ...
):
    """Add or toggle reaction on a post."""
    try:
        existing = query_one("""
            SELECT reaction_id, reaction_type FROM Reaction
            WHERE post_id = ? AND user_id = ?
        """, (post_id, payload.user_id))

        if existing:
            if existing["reaction_type"] == payload.reaction_type:
                # Same reaction clicked again -> remove
                execute_write("DELETE FROM Reaction WHERE reaction_id = ?", (existing["reaction_id"],))
                action = "removed"
            else:
                # Different reaction clicked -> update reaction type
                execute_write("UPDATE Reaction SET reaction_type = ? WHERE reaction_id = ?", 
                              (payload.reaction_type, existing["reaction_id"]))
                action = "updated"
        else:
            execute_write("""
                INSERT INTO Reaction (post_id, user_id, reaction_type)
                VALUES (?, ?, ?)
            """, (post_id, payload.user_id, payload.reaction_type))
            action = "added"

            # Notify post owner if it's not self-reaction
            post_info = query_one("SELECT user_id FROM Post WHERE post_id = ?", (post_id,))
            if post_info and post_info["user_id"] != payload.user_id:
                sender = query_one("SELECT username FROM Users WHERE user_id = ?", (payload.user_id,))
                sender_name = sender["username"] if sender else "Someone"
                execute_write("""
                    INSERT INTO Notification (recipient_id, content, ref_id, ref_type)
                    VALUES (?, ?, ?, 'REACTION')
                """, (post_info["user_id"], f"{sender_name} reacted with {payload.reaction_type} to your post.", post_id))

        # Telemetry
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'REACT_POST', 'WEB', ?)
        """, (payload.user_id, f'{{"post_id": {post_id}, "action": "{action}", "type": "{payload.reaction_type}"}}'))

        return {
            "success": True,
            "action": action,
            "reaction_type": payload.reaction_type
        }
    except Exception as e:
        logger.error(f"Error reacting to post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{post_id}/comments")
def add_comment(
    post_id: int = Path(...),
    payload: CreateCommentRequest = ...
):
    """Add a comment or reply to a post."""
    try:
        comment_id = execute_write("""
            INSERT INTO Comment (post_id, user_id, reply_to, content)
            VALUES (?, ?, ?, ?)
        """, (post_id, payload.user_id, payload.reply_to, payload.content))

        # Notify post owner
        post_info = query_one("SELECT user_id FROM Post WHERE post_id = ?", (post_id,))
        if post_info and post_info["user_id"] != payload.user_id:
            sender = query_one("SELECT username FROM Users WHERE user_id = ?", (payload.user_id,))
            sender_name = sender["username"] if sender else "Someone"
            execute_write("""
                INSERT INTO Notification (recipient_id, content, ref_id, ref_type)
                VALUES (?, ?, ?, 'COMMENT')
            """, (post_info["user_id"], f"{sender_name} commented: {payload.content[:35]}...", post_id))

        # Telemetry
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'COMMENT_POST', 'WEB', ?)
        """, (payload.user_id, f'{{"post_id": {post_id}, "comment_id": {comment_id}}}'))

        return {
            "success": True,
            "message": "Comment added successfully",
            "comment_id": comment_id
        }
    except Exception as e:
        logger.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
