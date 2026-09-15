import os
import sys
import sqlite3
import pymysql
from dotenv import load_dotenv

load_dotenv()

SQLITE_PATH = os.getenv("DB_PATH", "social_media.db")
MYSQL_HOST = os.getenv("DB_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("DB_PORT", 3306))
MYSQL_USER = os.getenv("DB_USER", "root")
MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "raju@123")
MYSQL_DB = os.getenv("DB_NAME", "social_media")

TABLES_IN_ORDER = [
    "Users",
    "User_Credentials",
    "Profile_Pic",
    "Regular_User",
    "Admin_User",
    "Post",
    "Comment",
    "Reaction",
    "Community_Group",
    "Group_Members",
    "Hashtag",
    "Post_Hashtag",
    "Notification",
    "Friend_Recommendation",
    "Message",
    "Event_Analysis",
    "User_Follow"
]

def run_migration():
    print("=" * 60)
    print("MIGRATING SQLITE -> MYSQL (Preserving IDs & Relationships)")
    print("=" * 60)

    if not os.path.exists(SQLITE_PATH):
        print(f"Error: SQLite database file '{SQLITE_PATH}' not found.")
        sys.exit(1)

    # 1. Connect to MySQL and apply schema
    print(f"Connecting to MySQL at {MYSQL_HOST}:{MYSQL_PORT}...")
    root_conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        autocommit=True
    )
    with root_conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    root_conn.close()

    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        autocommit=False
    )

    schema_file = os.path.join(os.path.dirname(__file__), "schema_mysql.sql")
    if os.path.exists(schema_file):
        print(f"Applying MySQL DDL from {schema_file}...")
        with open(schema_file, "r", encoding="utf-8") as f:
            ddl_statements = f.read().split(";")
            with mysql_conn.cursor() as cur:
                cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
                for stmt in ddl_statements:
                    cleaned = stmt.strip()
                    # Remove comment lines from the beginning of the statement
                    lines = [line for line in cleaned.splitlines() if not line.strip().startswith("--")]
                    stmt_without_comments = "\n".join(lines).strip()
                    if stmt_without_comments:
                        cur.execute(stmt_without_comments)
                cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
            mysql_conn.commit()
        print("Schema successfully applied.")

    # 2. Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    # 3. Transfer data table by table
    with mysql_conn.cursor() as cur:
        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        for table in TABLES_IN_ORDER:
            # Check if table exists in SQLite
            check_table = sqlite_conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
            ).fetchone()
            if not check_table:
                print(f" - Table {table} does not exist in SQLite, skipping.")
                continue

            # Clear any existing rows in MySQL target table
            cur.execute(f"TRUNCATE TABLE `{table}`")

            # Fetch columns and rows from SQLite
            sqlite_cur = sqlite_conn.cursor()
            sqlite_cur.execute(f"SELECT * FROM `{table}`")
            rows = sqlite_cur.fetchall()
            
            if not rows:
                print(f" - Table {table}: 0 rows (empty)")
                continue

            col_names = [desc[0] for desc in sqlite_cur.description]
            cols_escaped = ", ".join([f"`{c}`" for c in col_names])
            placeholders = ", ".join(["%s"] * len(col_names))
            insert_sql = f"INSERT INTO `{table}` ({cols_escaped}) VALUES ({placeholders})"

            row_tuples = [tuple(r[c] for c in col_names) for r in rows]
            cur.executemany(insert_sql, row_tuples)
            print(f" - Table {table}: Migrated {len(rows)} records.")

        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
    mysql_conn.commit()

    # 4. Verify table row counts match
    print("\n--- Verifying Row Counts ---")
    verified_all = True
    with mysql_conn.cursor() as cur:
        for table in TABLES_IN_ORDER:
            check_table = sqlite_conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
            ).fetchone()
            if not check_table:
                continue
            
            sqlite_count = sqlite_conn.execute(f"SELECT COUNT(*) FROM `{table}`").fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            mysql_count = cur.fetchone()[0]

            match_str = "[OK]" if sqlite_count == mysql_count else "[MISMATCH]"
            print(f" {match_str} {table:25} | SQLite: {sqlite_count:4} | MySQL: {mysql_count:4}")
            if sqlite_count != mysql_count:
                verified_all = False

    sqlite_conn.close()
    mysql_conn.close()

    if verified_all:
        print("\nDATA MIGRATION COMPLETED AND VERIFIED 100% SUCCESSFULLY! 🎉")
    else:
        print("\nWARNING: Some counts did not match. Check details above.")

if __name__ == "__main__":
    run_migration()
