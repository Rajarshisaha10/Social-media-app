import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

try:
    import certifi
    if "SSL_CERT_FILE" not in os.environ:
        os.environ["SSL_CERT_FILE"] = certifi.where()
except ImportError:
    pass

from neo4j import GraphDatabase, Driver

load_dotenv()
logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

_driver: Optional[Driver] = None

def get_driver() -> Optional[Driver]:
    """Obtain or initialize the pooled Neo4j Driver (AuraDB or self-hosted)."""
    global _driver
    if not NEO4J_URI or not NEO4J_PASSWORD:
        return None

    if _driver is None:
        try:
            _driver = GraphDatabase.driver(
                NEO4J_URI,
                auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
                max_connection_lifetime=30 * 60,
                max_connection_pool_size=25,
                connection_acquisition_timeout=5.0
            )
            # Verify connectivity
            _driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j database.")
        except Exception as e:
            logger.warning(f"Neo4j connection could not be established: {e}")
            _driver = None
            return None

    return _driver

def is_neo4j_available() -> bool:
    """Return True if Neo4j URI is configured and reachable."""
    try:
        driver = get_driver()
        if driver is None:
            return False
        driver.verify_connectivity()
        return True
    except Exception:
        return False

def close_driver():
    """Close the driver connection pool."""
    global _driver
    if _driver:
        _driver.close()
        _driver = None

def run_cypher(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute a Cypher query and return results as a list of Python dictionaries."""
    driver = get_driver()
    if not driver:
        raise ConnectionError("Neo4j is not configured or reachable. Check NEO4J_URI and credentials.")

    with driver.session(database=NEO4J_DATABASE) as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]

def init_neo4j_schema():
    """Create constraints and full-text search indexes on Neo4j startup."""
    driver = get_driver()
    if not driver:
        logger.info("Skipping Neo4j schema initialization: Neo4j credentials not configured yet.")
        return

    statements = [
        # Uniqueness constraints
        "CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE",
        "CREATE CONSTRAINT unique_user_handle IF NOT EXISTS FOR (u:User) REQUIRE u.handle IS UNIQUE",
        "CREATE CONSTRAINT unique_post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.postId IS UNIQUE",
        "CREATE CONSTRAINT unique_hashtag_tag IF NOT EXISTS FOR (h:Hashtag) REQUIRE h.tag IS UNIQUE",

        # Secondary indexes for sorting and filtering
        "CREATE INDEX post_created_at_idx IF NOT EXISTS FOR (p:Post) ON (p.createdAt)",

        # Topic node constraint
        "CREATE CONSTRAINT unique_topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE",

        # Built-in Lucene Full-Text Search Indexes
        "CREATE FULLTEXT INDEX postSearchIndex IF NOT EXISTS FOR (p:Post) ON EACH [p.content]",
        "CREATE FULLTEXT INDEX userSearchIndex IF NOT EXISTS FOR (u:User) ON EACH [u.handle, u.displayName]",
        "CREATE FULLTEXT INDEX userBioInterestsIndex IF NOT EXISTS FOR (u:User) ON EACH [u.bio, u.interests]"
    ]

    with driver.session(database=NEO4J_DATABASE) as session:
        for stmt in statements:
            try:
                session.run(stmt)
            except Exception as e:
                # Log non-fatal error (e.g. index already exists or unsupported edition)
                logger.debug(f"Schema statement '{stmt}' result: {e}")

    logger.info("Neo4j constraints and fulltext indexes successfully initialized.")

STOPWORDS = {
    "with", "from", "that", "this", "their", "about", "also", "into", "over",
    "more", "when", "then", "lead", "lover", "user", "enthusiast", "maintainer",
    "make", "fast", "member", "socialsphere", "full", "stack", "have", "been"
}

def sync_user_topics(user_id: int, bio: str = "", interests: str = ""):
    """Extract topic keywords from bio and comma-separated interests and connect to (:Topic) nodes."""
    import re
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
            MATCH (u:User {userId: $userId})
            UNWIND $topics AS topicName
            MERGE (t:Topic {name: topicName})
            MERGE (u)-[:INTERESTED_IN]->(t)
        """, {"userId": user_id, "topics": list(extracted_topics)})
    except Exception as e:
        logger.warning(f"Error syncing user topics for user {user_id}: {e}")
