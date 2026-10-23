"""
Extract topics/interests from User bios and interests fields,
creating (:Topic) nodes and (User)-[:INTERESTED_IN]->(Topic) graph relationships.
Also ensures the Lucene userBioInterestsIndex is created.
"""

import os
import re
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

import sys

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db import get_driver, run_cypher, is_neo4j_available

STOPWORDS = {
    "with", "from", "that", "this", "their", "about", "also", "into", "over",
    "more", "when", "then", "lead", "lover", "user", "enthusiast", "maintainer",
    "make", "fast", "member", "socialsphere", "full", "stack", "have", "been"
}

def build_topic_graph():
    if not is_neo4j_available():
        logger.error("Neo4j is not available. Please check .env credentials.")
        return False

    logger.info("1. Creating schema constraints and fulltext indexes...")
    try:
        run_cypher("CREATE CONSTRAINT unique_topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE")
    except Exception as e:
        logger.info(f"Topic constraint info: {e}")

    try:
        run_cypher("CREATE FULLTEXT INDEX userBioInterestsIndex IF NOT EXISTS FOR (u:User) ON EACH [u.bio, u.interests]")
    except Exception as e:
        logger.info(f"Fulltext index info: {e}")

    logger.info("2. Fetching all users and their bios/interests...")
    users = run_cypher("MATCH (u:User) RETURN u.userId AS userId, u.bio AS bio, u.interests AS interests")

    total_topics_created = 0
    total_edges_created = 0

    for u in users:
        user_id = u["userId"]
        bio = u.get("bio") or ""
        interests = u.get("interests") or ""

        # Extract explicit comma-separated interests
        extracted_topics = set()
        for item in interests.split(","):
            clean = item.strip().lower()
            if len(clean) >= 2:
                extracted_topics.add(clean)

        # Extract meaningful keywords from bio
        # Words of length >= 3 not in stopwords
        words = re.findall(r'[a-zA-Z0-9+#]+', bio.lower())
        for w in words:
            if len(w) >= 3 and w not in STOPWORDS:
                extracted_topics.add(w)

        if not extracted_topics:
            continue

        cypher = """
            MATCH (u:User {userId: $userId})
            UNWIND $topics AS topicName
            MERGE (t:Topic {name: topicName})
            MERGE (u)-[:INTERESTED_IN]->(t)
            RETURN count(t) AS cnt
        """
        res = run_cypher(cypher, {"userId": user_id, "topics": list(extracted_topics)})
        if res:
            total_edges_created += res[0]["cnt"]

    logger.info(f"✓ Connected {total_edges_created} (:User)-[:INTERESTED_IN]->(:Topic) relationships across {len(users)} users.")
    return True

if __name__ == "__main__":
    build_topic_graph()
