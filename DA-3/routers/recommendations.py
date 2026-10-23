import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Path, Query, Depends, status
from db import query_all
from auth import get_current_user, get_optional_current_user
from graph_db import is_neo4j_available, run_cypher

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"]
)

@router.get("")
def get_current_user_recommendations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """GET friend recommendations for the authenticated user using Neo4j Graph Link Prediction with SQL fallback."""
    return _fetch_friend_recommendations(current_user["user_id"])

@router.get("/posts")
def get_post_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """GET content/post recommendations based on 2-hop network engagement and recency decay."""
    user_id = current_user["user_id"]
    if is_neo4j_available():
        try:
            cypher = """
                MATCH (me:User {userId: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS*0..1]->(peer:User)
                MATCH (peer)-[rel:LIKED]->(p:Post)
                WHERE NOT (me)-[:LIKED]->(p)
                  AND NOT (me)-[:POSTED]->(p)
                OPTIONAL MATCH (p)-[:TAGGED_WITH]->(h:Hashtag)
                OPTIONAL MATCH (author:User)-[:POSTED]->(p)
                WITH p, author, collect(DISTINCT h.tag) AS hashtags, count(DISTINCT peer) AS friendLikes
                ORDER BY friendLikes DESC, p.createdAt DESC
                LIMIT $limit
                RETURN p.postId AS postId,
                       p.content AS content,
                       p.createdAt AS createdAt,
                       p.url AS mediaUrl,
                       author.handle AS authorHandle,
                       author.displayName AS authorName,
                       hashtags,
                       friendLikes
            """
            results = run_cypher(cypher, {"userId": user_id, "limit": limit})
            return {
                "success": True,
                "engine": "neo4j",
                "count": len(results),
                "recommendations": results
            }
        except Exception as e:
            logger.warning(f"Neo4j post recommendation failed: {e}. Falling back to default feed.")

    # Fallback to recent popular posts via SQL
    sql = """
        SELECT p.post_id, p.content, p.created_date, p.url, u.username AS authorHandle,
               COUNT(r.reaction_id) AS likesCount
        FROM Post p
        JOIN Users u ON u.user_id = p.user_id
        LEFT JOIN Reaction r ON r.post_id = p.post_id
        WHERE p.user_id != ?
        GROUP BY p.post_id
        ORDER BY likesCount DESC, p.post_id DESC
        LIMIT ?
    """
    rows = query_all(sql, (user_id, limit))
    return {
        "success": True,
        "engine": "relational_fallback",
        "count": len(rows),
        "recommendations": rows
    }

@router.get("/hashtags")
def get_trending_cluster_hashtags(
    limit: int = Query(5, ge=1, le=20),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """GET trending hashtags within user's 2-hop social cluster."""
    user_id = current_user["user_id"]
    if is_neo4j_available():
        try:
            cypher = """
                MATCH (me:User {userId: $userId})-[:FOLLOWS]->(connection:User)
                MATCH (connection)-[:LIKED]->(p:Post)-[:TAGGED_WITH]->(h:Hashtag)
                WITH h, count(DISTINCT connection) AS uniqueFriendsEngaged, count(p) AS postCount
                ORDER BY (uniqueFriendsEngaged * 2 + postCount) DESC
                LIMIT $limit
                RETURN h.tag AS hashtag, uniqueFriendsEngaged, postCount
            """
            results = run_cypher(cypher, {"userId": user_id, "limit": limit})
            return {
                "success": True,
                "engine": "neo4j",
                "count": len(results),
                "hashtags": results
            }
        except Exception as e:
            logger.warning(f"Neo4j hashtag recommendation failed: {e}. Falling back.")

    # Fallback: Top global hashtags from SQL
    sql = """
        SELECT h.tag AS hashtag, COUNT(ph.post_id) AS postCount
        FROM Hashtag h
        JOIN Post_Hashtag ph ON ph.hashtag_id = h.hashtag_id
        GROUP BY h.hashtag_id
        ORDER BY postCount DESC
        LIMIT ?
    """
    rows = query_all(sql, (limit,))
    return {
        "success": True,
        "engine": "relational_fallback",
        "count": len(rows),
        "hashtags": rows
    }

@router.get("/graph-data")
def get_graph_visualization_data():
    """Fetch live nodes and relationships from Neo4j for interactive 3D/2D Graph Visualization."""
    if is_neo4j_available():
        try:
            cypher = """
                // 1. Get all Users
                MATCH (u:User)
                WITH collect({
                    id: 'u_' + toString(u.userId),
                    userId: u.userId,
                    label: '@' + u.handle,
                    name: u.displayName,
                    type: 'user',
                    bio: u.bio,
                    pic: u.profilePic
                }) AS userNodes

                // 2. Get top 35 shared topics
                MATCH (t:Topic)<-[:INTERESTED_IN]-(u:User)
                WITH userNodes, t, count(u) AS degree
                ORDER BY degree DESC
                LIMIT 35
                WITH userNodes, collect({
                    id: 't_' + t.name,
                    label: '#' + t.name,
                    type: 'topic',
                    degree: degree
                }) AS topicNodes

                // 3. Get follow links
                OPTIONAL MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
                WITH userNodes, topicNodes, collect(DISTINCT CASE WHEN u1 IS NOT NULL AND u2 IS NOT NULL THEN {
                    source: 'u_' + toString(u1.userId),
                    target: 'u_' + toString(u2.userId),
                    type: 'FOLLOWS',
                    label: 'FOLLOWS'
                } END) AS rawFollowLinks

                // 4. Get topic links for selected topics
                MATCH (u:User)-[r:INTERESTED_IN]->(t:Topic)
                WHERE 't_' + t.name IN [tn IN topicNodes | tn.id]
                WITH userNodes, topicNodes, rawFollowLinks, collect(DISTINCT {
                    source: 'u_' + toString(u.userId),
                    target: 't_' + t.name,
                    type: 'INTERESTED_IN',
                    label: 'INTERESTED_IN'
                }) AS topicLinks

                RETURN userNodes, topicNodes,
                       [l IN rawFollowLinks WHERE l IS NOT NULL] AS followLinks,
                       topicLinks
            """
            data = run_cypher(cypher)[0]
            nodes = data["userNodes"] + data["topicNodes"]
            links = data["followLinks"] + data["topicLinks"]

            return {
                "success": True,
                "engine": "neo4j_auradb",
                "nodes": nodes,
                "links": links,
                "stats": {
                    "usersCount": len(data["userNodes"]),
                    "topicsCount": len(data["topicNodes"]),
                    "totalLinks": len(links)
                }
            }
        except Exception as e:
            logger.warning(f"Neo4j graph visualization error: {e}. Falling back to SQLite.")

    # Relational fallback
    users_sql = "SELECT user_id, username, bio FROM Users"
    user_rows = query_all(users_sql)
    nodes = []
    links = []
    topics_seen = {}

    for u in user_rows:
        uid = f"u_{u['user_id']}"
        nodes.append({
            "id": uid,
            "userId": u["user_id"],
            "label": f"@{u['username']}",
            "name": u["username"],
            "type": "user",
            "bio": u["bio"] or ""
        })

    return {
        "success": True,
        "engine": "relational_fallback",
        "nodes": nodes,
        "links": links,
        "stats": {"usersCount": len(nodes), "topicsCount": 0, "totalLinks": 0}
    }

@router.get("/{user_id}")
def get_recommendations_by_user_id(
    user_id: int = Path(..., description="ID of the user to fetch recommendations for"),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """GET friend recommendations using Neo4j Graph Link Prediction with SQL fallback."""
    return _fetch_friend_recommendations(user_id)

def _fetch_friend_recommendations(user_id: Any):
    typed_user_id = int(user_id) if str(user_id).isdigit() else user_id
    # 1. Try real-time Neo4j Bio & Interest Topic Graph Recommendation
    if is_neo4j_available():
        try:
            # Query users sharing topics extracted from bio and interests, boosted by mutual friends
            cypher = """
                MATCH (me:User)
                WHERE me.userId = $userId OR toString(me.userId) = toString($userId)
                MATCH (me)-[:INTERESTED_IN]->(t:Topic)<-[:INTERESTED_IN]-(other:User)
                WHERE other <> me 
                  AND other.userId <> me.userId
                  AND toString(other.userId) <> toString(me.userId)
                  AND NOT (me)-[:FOLLOWS]->(other)
                WITH me, other, collect(DISTINCT t.name) AS sharedTopics, count(DISTINCT t) AS sharedTopicCount
                OPTIONAL MATCH (me)-[:FOLLOWS]->(f:User)-[:FOLLOWS]->(other)
                WITH other, sharedTopics, sharedTopicCount, count(DISTINCT f) AS mutualFriends
                WITH other, sharedTopics, mutualFriends,
                     round(0.60 + (sharedTopicCount * 0.12) + (CASE WHEN mutualFriends > 0 THEN 0.10 ELSE 0.0 END), 2) AS rawScore
                WITH other, sharedTopics, mutualFriends,
                     CASE WHEN rawScore > 0.98 THEN 0.98 ELSE rawScore END AS matchScore
                ORDER BY matchScore DESC, size(sharedTopics) DESC
                LIMIT 12
                RETURN other.userId AS RecommendedUserID,
                       coalesce(other.handle, other.username, other.displayName) AS Username,
                       coalesce(other.email, '') AS Email,
                       coalesce(other.bio, '') AS Bio,
                       coalesce(other.location, 'Global') AS Location,
                       coalesce(other.interests, '') AS Interests,
                       coalesce(other.profilePic, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde') AS ProfilePic,
                       sharedTopics AS SharedTopics,
                       matchScore AS Score
            """
            graph_results = run_cypher(cypher, {"userId": typed_user_id})

            formatted_results = []
            seen_ids = set()
            for r in graph_results:
                seen_ids.add(r["RecommendedUserID"])
                # Highlight shared topics in the interests line for high UX clarity
                if r.get("SharedTopics"):
                    shared_str = ", ".join([w.title() for w in r["SharedTopics"][:3]])
                    r["Interests"] = f"Shared: {shared_str}" if shared_str else r.get("Interests", "")
                formatted_results.append(r)

            # If fewer than 6 suggestions (e.g. sparse profile), backfill with other users from the graph
            if len(formatted_results) < 6:
                needed = 6 - len(formatted_results)
                backfill_cypher = """
                    MATCH (other:User)
                    WHERE other.userId <> $userId 
                      AND toString(other.userId) <> toString($userId)
                      AND NOT other.userId IN $seenIds
                    RETURN other.userId AS RecommendedUserID,
                           coalesce(other.handle, other.username, other.displayName) AS Username,
                           coalesce(other.email, '') AS Email,
                           coalesce(other.bio, '') AS Bio,
                           coalesce(other.location, 'Global') AS Location,
                           coalesce(other.interests, '') AS Interests,
                           coalesce(other.profilePic, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde') AS ProfilePic,
                           [] AS SharedTopics,
                           0.68 AS Score
                    LIMIT $needed
                """
                backfill = run_cypher(backfill_cypher, {
                    "userId": typed_user_id,
                    "seenIds": list(seen_ids) if seen_ids else [-1],
                    "needed": needed
                })
                formatted_results.extend(backfill)

            if formatted_results:
                return {
                    "success": True,
                    "engine": "neo4j_bio_topic_graph",
                    "userId": typed_user_id,
                    "count": len(formatted_results),
                    "recommendations": formatted_results
                }
        except Exception as e:
            logger.warning(f"Neo4j bio recommendation error for user {user_id}: {e}. Falling back to relational table.")

    # 2. Relational fallback from Friend_Recommendation table / SQL
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
            WHERE fr.user_id = ? AND LOWER(u.username) != 'rajarshi'
            ORDER BY fr.score DESC
        """
        rows = query_all(sql, (user_id,))
        return {
            "success": True,
            "engine": "relational_fallback",
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
