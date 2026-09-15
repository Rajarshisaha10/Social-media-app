import logging
from fastapi import APIRouter, HTTPException, Query
from db import query_one, query_all

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/overview")
def get_analytics_overview():
    """GET overall platform analytics across all 16 entity tables."""
    try:
        users = query_one("SELECT COUNT(*) AS totalUsers FROM Users")
        creds = query_one("SELECT COUNT(*) AS totalCreds FROM User_Credentials")
        posts = query_one("SELECT COUNT(*) AS totalPosts FROM Post")
        comments = query_one("SELECT COUNT(*) AS totalComments FROM Comment")
        reactions = query_one("SELECT COUNT(*) AS totalReactions FROM Reaction")
        messages = query_one("SELECT COUNT(*) AS totalMessages FROM Message")
        groups = query_one("SELECT COUNT(*) AS totalGroups FROM Community_Group")
        recommendations = query_one("SELECT COUNT(*) AS totalRecommendations FROM Friend_Recommendation")
        notifications = query_one("SELECT COUNT(*) AS totalNotifications FROM Notification")
        events = query_one("SELECT COUNT(*) AS totalEvents FROM Event_Analysis")
        hashtags = query_one("SELECT COUNT(*) AS totalHashtags FROM Hashtag")
        regular_users = query_one("SELECT COUNT(*) AS totalRegular FROM Regular_User")
        admin_users = query_one("SELECT COUNT(*) AS totalAdmin FROM Admin_User")
        profile_pics = query_one("SELECT COUNT(*) AS totalPics FROM Profile_Pic")
        group_members = query_one("SELECT COUNT(*) AS totalMemberships FROM Group_Members")
        post_hashtags = query_one("SELECT COUNT(*) AS totalTaggedPosts FROM Post_Hashtag")
        follows = query_one("SELECT COUNT(*) AS totalFollows FROM User_Follow")

        return {
            "success": True,
            "analytics": {
                "totalUsers": users.get("totalUsers", 0) if users else 0,
                "totalCreds": creds.get("totalCreds", 0) if creds else 0,
                "totalPosts": posts.get("totalPosts", 0) if posts else 0,
                "totalComments": comments.get("totalComments", 0) if comments else 0,
                "totalReactions": reactions.get("totalReactions", 0) if reactions else 0,
                "totalMessages": messages.get("totalMessages", 0) if messages else 0,
                "totalGroups": groups.get("totalGroups", 0) if groups else 0,
                "totalRecommendations": recommendations.get("totalRecommendations", 0) if recommendations else 0,
                "totalNotifications": notifications.get("totalNotifications", 0) if notifications else 0,
                "totalEvents": events.get("totalEvents", 0) if events else 0,
                "totalHashtags": hashtags.get("totalHashtags", 0) if hashtags else 0,
                "totalRegular": regular_users.get("totalRegular", 0) if regular_users else 0,
                "totalAdmin": admin_users.get("totalAdmin", 0) if admin_users else 0,
                "totalPics": profile_pics.get("totalPics", 0) if profile_pics else 0,
                "totalMemberships": group_members.get("totalMemberships", 0) if group_members else 0,
                "totalTaggedPosts": post_hashtags.get("totalTaggedPosts", 0) if post_hashtags else 0,
                "totalFollows": follows.get("totalFollows", 0) if follows else 0
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

@router.get("/events")
def get_recent_events(limit: int = Query(20, ge=1, le=100)):
    """GET recent platform audit and telemetry events from Event_Analysis table."""
    try:
        sql = """
            SELECT 
                ea.event_id,
                ea.user_id,
                u.username,
                ea.event_type,
                ea.event_time,
                ea.device_type,
                ea.metadata
            FROM Event_Analysis ea
            JOIN Users u ON u.user_id = ea.user_id
            ORDER BY ea.event_id DESC
            LIMIT ?
        """
        events = query_all(sql, (limit,))
        return {
            "success": True,
            "count": len(events),
            "events": events
        }
    except Exception as e:
        logger.error(f"Error fetching event logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hashtags")
def get_trending_hashtags():
    """GET trending hashtags and their post counts."""
    try:
        sql = """
            SELECT 
                h.hashtag_id,
                h.tag,
                h.category,
                COUNT(ph.post_id) AS post_count
            FROM Hashtag h
            LEFT JOIN Post_Hashtag ph ON ph.hashtag_id = h.hashtag_id
            GROUP BY h.hashtag_id
            ORDER BY post_count DESC, h.hashtag_id ASC
        """
        tags = query_all(sql)
        return {
            "success": True,
            "count": len(tags),
            "hashtags": tags
        }
    except Exception as e:
        logger.error(f"Error fetching hashtags: {e}")
        raise HTTPException(status_code=500, detail=str(e))
