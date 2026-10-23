import os
import re
import logging
from typing import List, Dict, Any, Optional, Union
from dotenv import load_dotenv

# 1. Load environment variables across possible working directories
_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_dir, ".env"))
load_dotenv(os.path.join(os.path.dirname(_dir), ".env"))
load_dotenv()

# 2. Configure certifi root CA bundle for TLS verification on Windows
try:
    import certifi
    if "SSL_CERT_FILE" not in os.environ:
        os.environ["SSL_CERT_FILE"] = certifi.where()
except ImportError:
    pass

from neo4j import GraphDatabase, Driver
from neo4j.exceptions import ServiceUnavailable, ClientError, Neo4jError, AuthError

logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "")

_driver: Optional[Driver] = None

def get_driver() -> Optional[Driver]:
    """
    Obtain or initialize the pooled Neo4j Driver (AuraDB or self-hosted).
    Includes automatic SSL fallback for environments with enterprise/local proxy interception.
    """
    global _driver
    if not NEO4J_URI or not NEO4J_PASSWORD:
        return None

    if _driver is None:
        # First attempt: standard URI with system/certifi CA verification
        try:
            drv = GraphDatabase.driver(
                NEO4J_URI,
                auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
                max_connection_lifetime=30 * 60,
                max_connection_pool_size=25,
                connection_acquisition_timeout=8.0
            )
            drv.verify_connectivity()
            _driver = drv
            logger.info("Successfully connected to Neo4j database.")
            return _driver
        except Exception as e:
            logger.warning(f"Neo4j direct connection failed ({e}). Checking for SSL fallback...")

        # Second attempt: If SSL certificate verification failed (common on Windows proxy/Wi-Fi),
        # try neo4j+ssc:// (Self-Signed Certificate / enterprise trust)
        if "neo4j+s://" in NEO4J_URI or "bolt+s://" in NEO4J_URI:
            ssc_uri = NEO4J_URI.replace("neo4j+s://", "neo4j+ssc://").replace("bolt+s://", "bolt+ssc://")
            try:
                drv = GraphDatabase.driver(
                    ssc_uri,
                    auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
                    max_connection_lifetime=30 * 60,
                    max_connection_pool_size=25,
                    connection_acquisition_timeout=8.0
                )
                drv.verify_connectivity()
                _driver = drv
                logger.info("Successfully connected to Neo4j database using SSL fallback (neo4j+ssc).")
                return _driver
            except Exception as e2:
                logger.error(f"Neo4j SSL fallback connection failed: {e2}")

        _driver = None
        return None

    return _driver

def is_neo4j_available() -> bool:
    """Return True if Neo4j URI is configured and reachable."""
    global _driver
    try:
        driver = get_driver()
        if driver is None:
            return False
        driver.verify_connectivity()
        return True
    except Exception:
        _driver = None
        return False

def close_driver():
    """Close the driver connection pool."""
    global _driver
    if _driver:
        try:
            _driver.close()
        except Exception:
            pass
        _driver = None

def run_cypher(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Execute a Cypher query and return results as a list of Python dictionaries.
    Automatically handles database routing (AuraDB instance home database or local neo4j).
    """
    driver = get_driver()
    if not driver:
        raise ConnectionError("Neo4j is not configured or reachable. Check NEO4J_URI and credentials.")

    session_kwargs = {}
    if NEO4J_DATABASE and NEO4J_DATABASE.lower() not in ("neo4j", "default", ""):
        session_kwargs["database"] = NEO4J_DATABASE

    try:
        with driver.session(**session_kwargs) as session:
            result = session.run(query, params or {})
            return [record.data() for record in result]
    except Exception as e:
        err_msg = str(e).lower()
        if "databasenotfound" in err_msg or "routing table" in err_msg or "database does not exist" in err_msg:
            # Fallback to driver's default home database session
            with driver.session() as session:
                result = session.run(query, params or {})
                return [record.data() for record in result]
        raise e

def init_neo4j_schema():
    """Create uniqueness constraints and full-text search indexes on Neo4j startup."""
    driver = get_driver()
    if not driver:
        logger.info("Skipping Neo4j schema initialization: Neo4j credentials not configured yet.")
        return

    statements = [
        # Uniqueness constraints (User, Post, Community, Hashtag, Topic)
        "CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE",
        "CREATE CONSTRAINT unique_user_handle IF NOT EXISTS FOR (u:User) REQUIRE u.handle IS UNIQUE",
        "CREATE CONSTRAINT unique_post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.postId IS UNIQUE",
        "CREATE CONSTRAINT unique_community_id IF NOT EXISTS FOR (c:Community) REQUIRE c.communityId IS UNIQUE",
        "CREATE CONSTRAINT unique_hashtag_tag IF NOT EXISTS FOR (h:Hashtag) REQUIRE h.tag IS UNIQUE",
        "CREATE CONSTRAINT unique_topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE",

        # Secondary indexes for sorting and filtering
        "CREATE INDEX post_created_at_idx IF NOT EXISTS FOR (p:Post) ON (p.createdAt)",

        # Built-in Lucene Full-Text Search Indexes
        "CREATE FULLTEXT INDEX postSearchIndex IF NOT EXISTS FOR (p:Post) ON EACH [p.content]",
        "CREATE FULLTEXT INDEX userSearchIndex IF NOT EXISTS FOR (u:User) ON EACH [u.handle, u.displayName]",
        "CREATE FULLTEXT INDEX userBioInterestsIndex IF NOT EXISTS FOR (u:User) ON EACH [u.bio, u.interests]"
    ]

    for stmt in statements:
        try:
            run_cypher(stmt)
        except Exception as e:
            logger.debug(f"Schema statement '{stmt}' result: {e}")

    logger.info("Neo4j constraints and fulltext indexes successfully initialized.")

STOPWORDS = {
    "with", "from", "that", "this", "their", "about", "also", "into", "over",
    "more", "when", "then", "lead", "lover", "user", "enthusiast", "maintainer",
    "make", "fast", "member", "socialsphere", "full", "stack", "have", "been"
}

def sync_user_topics(user_id: Union[int, str], bio: str = "", interests: str = ""):
    """Extract topic keywords from bio and comma-separated interests and connect to (:Topic) nodes."""
    if not is_neo4j_available():
        return

    extracted_topics = set()
    if interests:
        for item in interests.split(","):
            clean = item.strip().lower()
            if len(clean) >= 2:
                extracted_topics.add(clean)

    if bio:
        words = re.findall(r'[a-zA-Z0-9+#]+', bio.lower())
        for w in words:
            if len(w) >= 3 and w not in STOPWORDS:
                extracted_topics.add(w)

    if not extracted_topics:
        return

    try:
        run_cypher("""
            MATCH (u:User)
            WHERE u.userId = $userId OR toString(u.userId) = toString($userId)
            UNWIND $topics AS topicName
            MERGE (t:Topic {name: topicName})
            MERGE (u)-[:INTERESTED_IN]->(t)
        """, {"userId": user_id, "topics": list(extracted_topics)})
    except Exception as e:
        logger.warning(f"Error syncing user topics for user {user_id}: {e}")

# =====================================================================
# Core Queries Specified in Digital Assignment 3 (DA-3 Group Report)
# =====================================================================

def get_recommendations(user_id: Union[int, str]) -> List[Dict[str, Any]]:
    """
    Find 2-hop friends-of-friends recommendations as defined in DA-3 Section 5.3 & 6.2.
    Traverses: (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggestion:User)
    Excludes the user themselves and users already followed.
    """
    query = """
        MATCH (me:User)
        WHERE me.userId = $user_id OR toString(me.userId) = toString($user_id)
        MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggestion:User)
        WHERE suggestion <> me
          AND suggestion.userId <> me.userId
          AND toString(suggestion.userId) <> toString(me.userId)
          AND NOT (me)-[:FOLLOWS]->(suggestion)
        RETURN DISTINCT suggestion.userId AS userId,
                        coalesce(suggestion.name, suggestion.displayName, suggestion.handle) AS name,
                        coalesce(suggestion.username, suggestion.handle) AS username
        ORDER BY name
    """
    return run_cypher(query, {"user_id": user_id})

def get_shared_communities(user_id: Union[int, str]) -> List[Dict[str, Any]]:
    """
    Find users who share communities as defined in DA-3 Section 5.4.
    Traverses: (me)-[:MEMBER_OF]->(c:Community)<-[:MEMBER_OF]-(other:User)
    """
    query = """
        MATCH (me:User)
        WHERE me.userId = $user_id OR toString(me.userId) = toString($user_id)
        MATCH (me)-[:MEMBER_OF]->(c:Community)<-[:MEMBER_OF]-(other:User)
        WHERE other <> me
          AND other.userId <> me.userId
          AND toString(other.userId) <> toString(me.userId)
        RETURN other.userId AS userId,
               coalesce(other.name, other.displayName, other.handle) AS name,
               coalesce(other.username, other.handle) AS username,
               collect(DISTINCT c.name) AS sharedCommunities
        ORDER BY name
    """
    return run_cypher(query, {"user_id": user_id})

def get_follower_count(user_id: Union[int, str]) -> Dict[str, Any]:
    """
    Count followers for a user as defined in DA-3 Section 5.5.
    Traverses: (u:User)<-[:FOLLOWS]-(follower:User)
    """
    query = """
        MATCH (u:User)
        WHERE u.userId = $user_id OR toString(u.userId) = toString($user_id)
        OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
        RETURN coalesce(u.name, u.displayName, u.handle) AS name,
               count(follower) AS followerCount
    """
    res = run_cypher(query, {"user_id": user_id})
    return res[0] if res else {"name": None, "followerCount": 0}

def seed_sample_dataset() -> bool:
    """
    Seed the synthetic sample dataset (U1..U4, C1..C2, P1) from DA-3 Section 5.1
    for repeatable demonstration and verification.
    """
    statements = [
        # Users
        "MERGE (a:User {userId: 'U1'}) SET a.name = 'Aarav', a.username = 'aarav', a.displayName = 'Aarav', a.handle = 'aarav', a.bio = 'Web developer building modern applications.'",
        "MERGE (b:User {userId: 'U2'}) SET b.name = 'Diya', b.username = 'diya', b.displayName = 'Diya', b.handle = 'diya', b.bio = 'Database enthusiast and fullstack developer.'",
        "MERGE (c:User {userId: 'U3'}) SET c.name = 'Kabir', c.username = 'kabir', c.displayName = 'Kabir', c.handle = 'kabir', c.bio = 'Database systems researcher.'",
        "MERGE (d:User {userId: 'U4'}) SET d.name = 'Meera', d.username = 'meera', d.displayName = 'Meera', d.handle = 'meera', d.bio = 'Distributed data architectures.'",

        # Communities
        "MERGE (g1:Community {communityId: 'C1'}) SET g1.name = 'Web Development', g1.description = 'Modern web frameworks, frontend performance, and fullstack engineering.'",
        "MERGE (g2:Community {communityId: 'C2'}) SET g2.name = 'Database Systems', g2.description = 'Graph, column-family, vector, and distributed SQL storage engines.'",

        # Follow relationships (A -> B -> C -> D)
        "MATCH (a:User {userId: 'U1'}), (b:User {userId: 'U2'}) MERGE (a)-[:FOLLOWS]->(b)",
        "MATCH (b:User {userId: 'U2'}), (c:User {userId: 'U3'}) MERGE (b)-[:FOLLOWS]->(c)",
        "MATCH (c:User {userId: 'U3'}), (d:User {userId: 'U4'}) MERGE (c)-[:FOLLOWS]->(d)",

        # Community memberships
        "MATCH (a:User {userId: 'U1'}), (g1:Community {communityId: 'C1'}) MERGE (a)-[:MEMBER_OF {role: 'MEMBER'}]->(g1)",
        "MATCH (b:User {userId: 'U2'}), (g1:Community {communityId: 'C1'}) MERGE (b)-[:MEMBER_OF {role: 'MEMBER'}]->(g1)",
        "MATCH (b:User {userId: 'U2'}), (g2:Community {communityId: 'C2'}) MERGE (b)-[:MEMBER_OF {role: 'MEMBER'}]->(g2)",
        "MATCH (c:User {userId: 'U3'}), (g2:Community {communityId: 'C2'}) MERGE (c)-[:MEMBER_OF {role: 'MEMBER'}]->(g2)",
        "MATCH (d:User {userId: 'U4'}), (g2:Community {communityId: 'C2'}) MERGE (d)-[:MEMBER_OF {role: 'MEMBER'}]->(g2)",

        # Post creation (U1 CREATED P1)
        "MERGE (p:Post {postId: 'P1'}) SET p.text = 'Exploring graph databases', p.content = 'Exploring graph databases', p.createdAt = datetime().epochSeconds, p.visibility = 'PUBLIC'",
        "MATCH (u:User {userId: 'U1'}), (p:Post {postId: 'P1'}) MERGE (u)-[:CREATED]->(p) MERGE (u)-[:POSTED]->(p)"
    ]

    for stmt in statements:
        run_cypher(stmt)

    logger.info("Sample synthetic dataset (U1..U4, C1..C2, P1) successfully seeded.")
    return True
