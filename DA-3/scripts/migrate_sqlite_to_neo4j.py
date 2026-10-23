"""
Migrate relational data from SQLite (social_media.db) into Neo4j Graph Database.
Creates:
  - (:User) nodes with handle, displayName, bio, location, interests, profilePic
  - (:Post) nodes with content, createdAt, url, visibility
  - (:Hashtag) nodes with tag
  - (User)-[:POSTED]->(Post)
  - (User)-[:FOLLOWS]->(User)
  - (User)-[:LIKED]->(Post)
  - (Post)-[:TAGGED_WITH]->(Hashtag)
"""

import os
import sys
import sqlite3
import logging
from dotenv import load_dotenv

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db import get_driver, init_neo4j_schema, NEO4J_DATABASE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "social_media.db")

def migrate():
    driver = get_driver()
    if not driver:
        logger.error("Could not connect to Neo4j. Please verify NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file.")
        return False

    if not os.path.exists(SQLITE_PATH):
        logger.error(f"SQLite database not found at {SQLITE_PATH}")
        return False

    logger.info("Initializing Neo4j constraints and fulltext indexes...")
    init_neo4j_schema()

    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with driver.session(database=NEO4J_DATABASE) as session:
        # 1. Migrate Users
        logger.info("Migrating Users...")
        cursor.execute("""
            SELECT u.user_id, u.username, u.email, u.bio, u.dob,
                   pp.image_url AS profile_pic,
                   ru.location, ru.interests
            FROM Users u
            LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
            LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
        """)
        users = [dict(row) for row in cursor.fetchall()]
        
        session.run("""
            UNWIND $users AS u
            MERGE (user:User {userId: u.user_id})
            SET user.handle = u.username,
                user.displayName = u.username,
                user.email = u.email,
                user.bio = coalesce(u.bio, ''),
                user.location = coalesce(u.location, ''),
                user.interests = coalesce(u.interests, ''),
                user.profilePic = coalesce(u.profile_pic, ''),
                user.dob = coalesce(u.dob, '')
        """, {"users": users})
        logger.info(f"✓ Migrated {len(users)} users.")

        # 2. Migrate Posts & Authors
        logger.info("Migrating Posts...")
        cursor.execute("""
            SELECT post_id, user_id, content, created_date, url, visibility
            FROM Post
        """)
        posts = [dict(row) for row in cursor.fetchall()]

        session.run("""
            UNWIND $posts AS p
            MERGE (post:Post {postId: p.post_id})
            SET post.content = coalesce(p.content, ''),
                post.createdAt = p.created_date,
                post.url = coalesce(p.url, ''),
                post.visibility = coalesce(p.visibility, 'PUBLIC')
            WITH post, p
            MATCH (author:User {userId: p.user_id})
            MERGE (author)-[:POSTED {at: p.created_date}]->(post)
        """, {"posts": posts})
        logger.info(f"✓ Migrated {len(posts)} posts and author relationships.")

        # 3. Migrate Follows
        logger.info("Migrating Follow relationships...")
        cursor.execute("SELECT follower_id, following_id, created_at FROM User_Follow")
        follows = [dict(row) for row in cursor.fetchall()]

        session.run("""
            UNWIND $follows AS f
            MATCH (follower:User {userId: f.follower_id})
            MATCH (following:User {userId: f.following_id})
            MERGE (follower)-[r:FOLLOWS]->(following)
            SET r.since = f.created_at
        """, {"follows": follows})
        logger.info(f"✓ Migrated {len(follows)} follow relationships.")

        # 4. Migrate Reactions (Likes)
        logger.info("Migrating Reactions / Likes...")
        cursor.execute("SELECT user_id, post_id, reaction_type, created_at FROM Reaction WHERE post_id IS NOT NULL")
        reactions = [dict(row) for row in cursor.fetchall()]

        session.run("""
            UNWIND $reactions AS r
            MATCH (u:User {userId: r.user_id})
            MATCH (p:Post {postId: r.post_id})
            MERGE (u)-[rel:LIKED]->(p)
            SET rel.type = coalesce(r.reaction_type, 'LIKE'),
                rel.at = r.created_at
        """, {"reactions": reactions})
        logger.info(f"✓ Migrated {len(reactions)} reactions.")

        # 5. Migrate Hashtags & Post_Hashtag
        logger.info("Migrating Hashtags...")
        cursor.execute("""
            SELECT ph.post_id, h.tag, h.category
            FROM Post_Hashtag ph
            JOIN Hashtag h ON h.hashtag_id = ph.hashtag_id
        """)
        tags = [dict(row) for row in cursor.fetchall()]

        session.run("""
            UNWIND $tags AS t
            MATCH (p:Post {postId: t.post_id})
            MERGE (h:Hashtag {tag: toLower(t.tag)})
            ON CREATE SET h.category = coalesce(t.category, 'General')
            MERGE (p)-[:TAGGED_WITH]->(h)
        """, {"tags": tags})
        logger.info(f"✓ Migrated {len(tags)} hashtag connections.")

    conn.close()
    logger.info("🎉 SQLite to Neo4j migration completed successfully!")
    return True

if __name__ == "__main__":
    migrate()
