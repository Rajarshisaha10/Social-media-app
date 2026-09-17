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
        counts = query_one("""
            SELECT
                (SELECT COUNT(*) FROM Users) AS totalUsers,
                (SELECT COUNT(*) FROM User_Credentials) AS totalCreds,
                (SELECT COUNT(*) FROM Post) AS totalPosts,
                (SELECT COUNT(*) FROM Comment) AS totalComments,
                (SELECT COUNT(*) FROM Reaction) AS totalReactions,
                (SELECT COUNT(*) FROM Message) AS totalMessages,
                (SELECT COUNT(*) FROM Community_Group) AS totalGroups,
                (SELECT COUNT(*) FROM Friend_Recommendation) AS totalRecommendations,
                (SELECT COUNT(*) FROM Notification) AS totalNotifications,
                (SELECT COUNT(*) FROM Event_Analysis) AS totalEvents,
                (SELECT COUNT(*) FROM Hashtag) AS totalHashtags,
                (SELECT COUNT(*) FROM Regular_User) AS totalRegular,
                (SELECT COUNT(*) FROM Admin_User) AS totalAdmin,
                (SELECT COUNT(*) FROM Profile_Pic) AS totalPics,
                (SELECT COUNT(*) FROM Group_Members) AS totalMemberships,
                (SELECT COUNT(*) FROM Post_Hashtag) AS totalTaggedPosts,
                (SELECT COUNT(*) FROM User_Follow) AS totalFollows
        """) or {}

        return {
            "success": True,
            "analytics": {
                "totalUsers": counts.get("totalUsers", 0),
                "totalCreds": counts.get("totalCreds", 0),
                "totalPosts": counts.get("totalPosts", 0),
                "totalComments": counts.get("totalComments", 0),
                "totalReactions": counts.get("totalReactions", 0),
                "totalMessages": counts.get("totalMessages", 0),
                "totalGroups": counts.get("totalGroups", 0),
                "totalRecommendations": counts.get("totalRecommendations", 0),
                "totalNotifications": counts.get("totalNotifications", 0),
                "totalEvents": counts.get("totalEvents", 0),
                "totalHashtags": counts.get("totalHashtags", 0),
                "totalRegular": counts.get("totalRegular", 0),
                "totalAdmin": counts.get("totalAdmin", 0),
                "totalPics": counts.get("totalPics", 0),
                "totalMemberships": counts.get("totalMemberships", 0),
                "totalTaggedPosts": counts.get("totalTaggedPosts", 0),
                "totalFollows": counts.get("totalFollows", 0)
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
