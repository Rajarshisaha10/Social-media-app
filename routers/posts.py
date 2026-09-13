import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path
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
def list_posts():
    """Get social media feed posts with author profiles, reaction counts, and comments."""
    try:
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
            # Fetch reactions
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
            "count": len(posts),
            "posts": posts
        }
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def create_post(payload: CreatePostRequest):
    """Create a new post."""
    try:
        user = query_one("SELECT user_id FROM Users WHERE user_id = ?", (payload.user_id,))
        if not user:
            raise HTTPException(status_code=400, detail=f"User {payload.user_id} does not exist.")

        post_id = execute_write("""
            INSERT INTO Post (user_id, content, url, visibility)
            VALUES (?, ?, ?, ?)
        """, (payload.user_id, payload.content, payload.url, payload.visibility))

        # Log event in Event_Analysis
        execute_write("""
            INSERT INTO Event_Analysis (user_id, event_type, device_type, metadata)
            VALUES (?, 'POST_CREATE', 'WEB', ?)
        """, (payload.user_id, f'{{"post_id": {post_id}}}'))

        return {
            "success": True,
            "message": "Post created successfully",
            "post_id": post_id
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
        # Check if user already reacted with this type
        existing = query_one("""
            SELECT reaction_id FROM Reaction
            WHERE post_id = ? AND user_id = ? AND reaction_type = ?
        """, (post_id, payload.user_id, payload.reaction_type))

        if existing:
            # Remove existing reaction (toggle off)
            execute_write("DELETE FROM Reaction WHERE reaction_id = ?", (existing["reaction_id"],))
            action = "removed"
        else:
            execute_write("""
                INSERT INTO Reaction (post_id, user_id, reaction_type)
                VALUES (?, ?, ?)
            """, (post_id, payload.user_id, payload.reaction_type))
            action = "added"

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

        return {
            "success": True,
            "message": "Comment added successfully",
            "comment_id": comment_id
        }
    except Exception as e:
        logger.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
