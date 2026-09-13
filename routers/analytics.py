import logging
from fastapi import APIRouter, HTTPException
from db import query_one

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/overview")
def get_analytics_overview():
    """GET overall platform analytics across all entity tables."""
    try:
        users = query_one("SELECT COUNT(*) AS totalUsers FROM Users")
        posts = query_one("SELECT COUNT(*) AS totalPosts FROM Post")
        comments = query_one("SELECT COUNT(*) AS totalComments FROM Comment")
        reactions = query_one("SELECT COUNT(*) AS totalReactions FROM Reaction")
        messages = query_one("SELECT COUNT(*) AS totalMessages FROM Message")
        groups = query_one("SELECT COUNT(*) AS totalGroups FROM Community_Group")
        recommendations = query_one("SELECT COUNT(*) AS totalRecommendations FROM Friend_Recommendation")
        notifications = query_one("SELECT COUNT(*) AS totalNotifications FROM Notification")
        events = query_one("SELECT COUNT(*) AS totalEvents FROM Event_Analysis")
        hashtags = query_one("SELECT COUNT(*) AS totalHashtags FROM Hashtag")

        return {
            "success": True,
            "analytics": {
                "totalUsers": users.get("totalUsers", 0) if users else 0,
                "totalPosts": posts.get("totalPosts", 0) if posts else 0,
                "totalComments": comments.get("totalComments", 0) if comments else 0,
                "totalReactions": reactions.get("totalReactions", 0) if reactions else 0,
                "totalMessages": messages.get("totalMessages", 0) if messages else 0,
                "totalGroups": groups.get("totalGroups", 0) if groups else 0,
                "totalRecommendations": recommendations.get("totalRecommendations", 0) if recommendations else 0,
                "totalNotifications": notifications.get("totalNotifications", 0) if notifications else 0,
                "totalEvents": events.get("totalEvents", 0) if events else 0,
                "totalHashtags": hashtags.get("totalHashtags", 0) if hashtags else 0
            }
        }
    except Exception as e:
        logger.error(f"Error fetching analytics overview: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Failed to fetch analytics",
                "error": str(e)
            }
        )
