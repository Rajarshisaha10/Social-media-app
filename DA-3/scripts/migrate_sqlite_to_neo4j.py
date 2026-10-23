"""
Migrate relational data from SQLite (social_media.db) into Neo4j Graph Database.
Creates complete property-graph model matching Digital Assignment 3 (DA-3):
  - (:User) nodes with userId, name, username, handle, displayName, bio, location, interests, profilePic, dob
  - (:Post) nodes with postId, text, content, createdAt, url, visibility
  - (:Community) nodes with communityId, name, description, privacy, createdAt
  - (:Hashtag) nodes with tag, category
  - (User)-[:POSTED]->(Post) & (User)-[:CREATED]->(Post)
  - (User)-[:FOLLOWS]->(User)
  - (User)-[:LIKED]->(Post) & (User)-[:INTERACTED_WITH]->(Post)
  - (User)-[:MEMBER_OF]->(Community)
  - (Post)-[:TAGGED_WITH]->(Hashtag)
  - (User)-[:INTERESTED_IN]->(Topic) (Extracted bio & interests graph)
"""

import os
import sys
import sqlite3
import logging
from dotenv import load_dotenv

# Ensure parent directory is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph_db import (
    get_driver,
    init_neo4j_schema,
    run_cypher,
    sync_user_topics,
    seed_sample_dataset,
    is_neo4j_available
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "social_media.db")

def migrate():
    if not is_neo4j_available():
        logger.error("Could not connect to Neo4j. Please verify NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file.")
        return False

    if not os.path.exists(SQLITE_PATH):
        logger.error(f"SQLite database not found at {SQLITE_PATH}")
        return False

    logger.info("1. Initializing Neo4j constraints and fulltext indexes...")
    init_neo4j_schema()

    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Migrate Users
    logger.info("2. Migrating Users...")
    cursor.execute("""
        SELECT u.user_id, u.username, u.email, u.bio, u.dob,
               pp.image_url AS profile_pic,
               ru.location, ru.interests
        FROM Users u
        LEFT JOIN Profile_Pic pp ON pp.user_id = u.user_id
        LEFT JOIN Regular_User ru ON ru.user_id = u.user_id
    """)
    users = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $users AS u
        MERGE (user:User {userId: u.user_id})
        SET user.handle = u.username,
            user.displayName = u.username,
            user.name = u.username,
            user.username = u.username,
            user.email = coalesce(u.email, ''),
            user.bio = coalesce(u.bio, ''),
            user.location = coalesce(u.location, 'Global'),
            user.interests = coalesce(u.interests, ''),
            user.profilePic = coalesce(u.profile_pic, ''),
            user.dob = coalesce(u.dob, '')
    """, {"users": users})
    logger.info(f"✓ Migrated {len(users)} users.")

    # 2. Migrate Posts & Authors
    logger.info("3. Migrating Posts & Authors...")
    cursor.execute("""
        SELECT post_id, user_id, content, created_date, url, visibility
        FROM Post
    """)
    posts = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $posts AS p
        MERGE (post:Post {postId: p.post_id})
        SET post.content = coalesce(p.content, ''),
            post.text = coalesce(p.content, ''),
            post.createdAt = p.created_date,
            post.url = coalesce(p.url, ''),
            post.visibility = coalesce(p.visibility, 'PUBLIC')
        WITH post, p
        MATCH (author:User {userId: p.user_id})
        MERGE (author)-[:POSTED {at: p.created_date}]->(post)
        MERGE (author)-[:CREATED {at: p.created_date}]->(post)
    """, {"posts": posts})
    logger.info(f"✓ Migrated {len(posts)} posts and author relationships (POSTED & CREATED).")

    # 3. Migrate Communities / Groups
    logger.info("4. Migrating Community Groups...")
    cursor.execute("""
        SELECT group_id, group_name, description, created_date, privacy_setting
        FROM Community_Group
    """)
    groups = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $groups AS g
        MERGE (c:Community {communityId: g.group_id})
        SET c.name = g.group_name,
            c.description = coalesce(g.description, ''),
            c.privacy = coalesce(g.privacy_setting, 'PUBLIC'),
            c.createdAt = g.created_date
    """, {"groups": groups})
    logger.info(f"✓ Migrated {len(groups)} community groups.")

    # 4. Migrate Community Memberships (MEMBER_OF)
    logger.info("5. Migrating Community Memberships (MEMBER_OF)...")
    cursor.execute("""
        SELECT group_id, user_id, role, join_date
        FROM Group_Members
    """)
    memberships = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $memberships AS m
        MATCH (u:User {userId: m.user_id})
        MATCH (c:Community {communityId: m.group_id})
        MERGE (u)-[r:MEMBER_OF]->(c)
        SET r.role = coalesce(m.role, 'MEMBER'),
            r.joinedAt = m.join_date
    """, {"memberships": memberships})
    logger.info(f"✓ Migrated {len(memberships)} community memberships (MEMBER_OF).")

    # 5. Migrate Follows
    logger.info("6. Migrating Follow relationships...")
    cursor.execute("SELECT follower_id, following_id, created_at FROM User_Follow")
    follows = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $follows AS f
        MATCH (follower:User {userId: f.follower_id})
        MATCH (following:User {userId: f.following_id})
        MERGE (follower)-[r:FOLLOWS]->(following)
        SET r.since = f.created_at
    """, {"follows": follows})
    logger.info(f"✓ Migrated {len(follows)} follow relationships.")

    # 6. Migrate Reactions (Likes & Interactions)
    logger.info("7. Migrating Reactions / Likes...")
    cursor.execute("SELECT user_id, post_id, reaction_type, created_at FROM Reaction WHERE post_id IS NOT NULL")
    reactions = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $reactions AS r
        MATCH (u:User {userId: r.user_id})
        MATCH (p:Post {postId: r.post_id})
        MERGE (u)-[rel:LIKED]->(p)
        SET rel.type = coalesce(r.reaction_type, 'LIKE'),
            rel.at = r.created_at
        MERGE (u)-[rel2:INTERACTED_WITH]->(p)
        SET rel2.type = coalesce(r.reaction_type, 'LIKE'),
            rel2.at = r.created_at
    """, {"reactions": reactions})
    logger.info(f"✓ Migrated {len(reactions)} reactions (LIKED & INTERACTED_WITH).")

    # 7. Migrate Hashtags & Post_Hashtag
    logger.info("8. Migrating Hashtags...")
    cursor.execute("""
        SELECT ph.post_id, h.tag, h.category
        FROM Post_Hashtag ph
        JOIN Hashtag h ON h.hashtag_id = ph.hashtag_id
    """)
    tags = [dict(row) for row in cursor.fetchall()]

    run_cypher("""
        UNWIND $tags AS t
        MATCH (p:Post {postId: t.post_id})
        MERGE (h:Hashtag {tag: toLower(t.tag)})
        ON CREATE SET h.category = coalesce(t.category, 'General')
        MERGE (p)-[:TAGGED_WITH]->(h)
    """, {"tags": tags})
    logger.info(f"✓ Migrated {len(tags)} hashtag connections.")

    # 8. Build Topic Nodes & User Bio/Interests Graph
    logger.info("9. Extracting Topic Nodes from Bios and Interests...")
    for u in users:
        sync_user_topics(u["user_id"], u.get("bio") or "", u.get("interests") or "")
    logger.info("✓ Synced user bio topics and affinity graph.")

    # 9. Seed DA-3 Sample Dataset (U1..U4, C1..C2, P1)
    logger.info("10. Seeding DA-3 synthetic demo dataset (U1..U4, C1..C2, P1)...")
    seed_sample_dataset()
    logger.info("✓ DA-3 sample dataset seeded.")

    conn.close()
    logger.info("🎉 SQLite to Neo4j migration completed successfully with full DA-3 compliance!")
    return True

if __name__ == "__main__":
    migrate()
