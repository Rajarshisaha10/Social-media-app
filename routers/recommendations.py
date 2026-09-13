import logging
from fastapi import APIRouter, HTTPException, Path
from db import query_all

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"]
)

@router.get("/{user_id}")
def get_recommendations_by_user_id(
    user_id: int = Path(..., description="ID of the user to fetch recommendations for")
):
    """GET friend recommendations for a specific user from Users and Friend_Recommendation."""
    try:
        sql = """
            SELECT
                fr.user_id AS UserID,
                fr.recommended_user_id AS RecommendedUserID,
                u.username AS Username,
                u.email AS Email,
                u.dob AS DOB,
                u.bio AS Bio,
                pp.image_url AS ProfilePic,
                ru.interests AS Interests,
                ru.location AS Location,
                fr.score AS Score,
                fr.generated_at AS GeneratedAt
            FROM Friend_Recommendation fr
            JOIN Users u
                ON u.user_id = fr.recommended_user_id
            LEFT JOIN Profile_Pic pp
                ON pp.user_id = u.user_id
            LEFT JOIN Regular_User ru
                ON ru.user_id = u.user_id
            WHERE fr.user_id = ?
            ORDER BY fr.score DESC
        """
        rows = query_all(sql, (user_id,))

        return {
            "success": True,
            "userId": user_id,
            "count": len(rows),
            "recommendations": rows
        }
    except Exception as e:
        logger.error(f"Error fetching recommendations for user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Failed to fetch recommendations",
                "error": str(e)
            }
        )
