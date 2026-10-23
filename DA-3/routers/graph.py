import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Path, Query
from neo4j.exceptions import Neo4jError

from graph_db import (
    is_neo4j_available,
    run_cypher,
    get_recommendations,
    get_shared_communities,
    get_follower_count,
    seed_sample_dataset
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/graph",
    tags=["Neo4j Graph Database (DA-3)"]
)

@router.get("/status")
def graph_status():
    """Check connectivity and fetch node & relationship statistics from Neo4j."""
    if not is_neo4j_available():
        return {
            "success": False,
            "status": "OFFLINE",
            "message": "Neo4j is not connected. Check NEO4J_URI and credentials."
        }

    try:
        stats = run_cypher("""
            RETURN {
                users: COUNT { (u:User) },
                posts: COUNT { (p:Post) },
                communities: COUNT { (c:Community) },
                hashtags: COUNT { (h:Hashtag) },
                topics: COUNT { (t:Topic) },
                follows: COUNT { ()-[:FOLLOWS]->() },
                memberships: COUNT { ()-[:MEMBER_OF]->() },
                likes: COUNT { ()-[:LIKED]->() }
            } AS stats
        """)
        return {
            "success": True,
            "status": "ONLINE",
            "message": "Neo4j graph database is active and responding to Cypher queries.",
            "statistics": stats[0]["stats"] if stats else {}
        }
    except Exception as e:
        logger.error(f"Error fetching Neo4j status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
def list_graph_users():
    """
    Read all users from Neo4j property graph (DA-3 Section 5.2).
    Query: MATCH (u:User) RETURN u.userId AS userId, coalesce(u.name, u.displayName, u.handle) AS name ORDER BY name
    """
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Neo4j graph database is offline.")

    try:
        users = run_cypher("""
            MATCH (u:User)
            RETURN u.userId AS userId,
                   coalesce(u.name, u.displayName, u.handle) AS name,
                   coalesce(u.username, u.handle) AS username,
                   coalesce(u.bio, '') AS bio,
                   coalesce(u.location, '') AS location
            ORDER BY name
        """)
        return {
            "success": True,
            "count": len(users),
            "users": users
        }
    except Exception as e:
        logger.error(f"Cypher error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{user_id}")
def graph_recommendations(
    user_id: str = Path(..., description="User ID (supports integer IDs like '1', '5' or sample IDs like 'U1')")
):
    """
    Find 2-hop friends-of-friends recommendations (DA-3 Section 5.3 & 6.2 & 6.3).
    Traverses: (me:User)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggestion:User)
    Excludes the user themselves and users already directly followed.
    """
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Graph database is offline or not configured")

    try:
        # Cast numeric strings to int if possible to match stored userId type
        typed_user_id = int(user_id) if user_id.isdigit() else user_id
        recommendations = get_recommendations(typed_user_id)
        return {
            "userId": user_id,
            "recommendations": recommendations
        }
    except Neo4jError as ne:
        logger.error(f"Neo4j query error: {ne}")
        raise HTTPException(status_code=503, detail="Graph database query failed")
    except Exception as e:
        logger.error(f"Error fetching graph recommendations for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shared-communities/{user_id}")
def graph_shared_communities(
    user_id: str = Path(..., description="User ID (e.g. '1', '5', or 'U1')")
):
    """
    Find users who share communities (DA-3 Section 5.4).
    Traverses: (me:User)-[:MEMBER_OF]->(c:Community)<-[:MEMBER_OF]-(other:User)
    """
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Graph database is offline.")

    try:
        typed_user_id = int(user_id) if user_id.isdigit() else user_id
        shared = get_shared_communities(typed_user_id)
        return {
            "success": True,
            "userId": user_id,
            "count": len(shared),
            "sharedCommunities": shared
        }
    except Exception as e:
        logger.error(f"Error fetching shared communities for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/followers-count/{user_id}")
def graph_followers_count(
    user_id: str = Path(..., description="User ID (e.g. '1', '5', or 'U2')")
):
    """
    Count followers using incoming FOLLOWS relationships (DA-3 Section 5.5).
    Traverses: (u:User)<-[:FOLLOWS]-(follower:User)
    """
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Graph database is offline.")

    try:
        typed_user_id = int(user_id) if user_id.isdigit() else user_id
        result = get_follower_count(typed_user_id)
        return {
            "success": True,
            "userId": user_id,
            "name": result.get("name"),
            "followerCount": result.get("followerCount", 0)
        }
    except Exception as e:
        logger.error(f"Error counting followers for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/communities")
def list_graph_communities():
    """List all community nodes and their member count."""
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Graph database is offline.")

    try:
        communities = run_cypher("""
            MATCH (c:Community)
            OPTIONAL MATCH (u:User)-[:MEMBER_OF]->(c)
            RETURN c.communityId AS communityId,
                   c.name AS name,
                   coalesce(c.description, '') AS description,
                   coalesce(c.privacy, 'PUBLIC') AS privacy,
                   count(u) AS memberCount
            ORDER BY c.name
        """)
        return {
            "success": True,
            "count": len(communities),
            "communities": communities
        }
    except Exception as e:
        logger.error(f"Error listing communities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed-sample")
def trigger_seed_sample():
    """
    Re-seed synthetic sample dataset (U1..U4, C1..C2, P1) from DA-3 Section 5.1
    for interactive verification of report Cypher queries.
    """
    if not is_neo4j_available():
        raise HTTPException(status_code=503, detail="Graph database is offline.")

    try:
        seed_sample_dataset()
        return {
            "success": True,
            "message": "DA-3 sample dataset (U1..U4, C1..C2, P1) seeded successfully."
        }
    except Exception as e:
        logger.error(f"Error seeding sample dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

