import os
import sys

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import query_all, execute_write, get_engine
from auth import hash_password

def run_migration():
    print(f"Starting password hashing migration on engine: {get_engine().upper()}...")
    
    # 1. Migrate Users table
    users = query_all("SELECT user_id, username, password FROM Users")
    user_migrated_count = 0
    for u in users:
        pwd = u.get("password") or ""
        if not pwd.startswith(("$2b$", "$2a$", "$2y$")):
            hashed = hash_password(pwd)
            execute_write("UPDATE Users SET password = ? WHERE user_id = ?", (hashed, u["user_id"]))
            user_migrated_count += 1
            print(f" [MIGRATED] User '{u['username']}' (ID: {u['user_id']}) password hashed.")
        else:
            print(f" [SKIP] User '{u['username']}' (ID: {u['user_id']}) already has bcrypt hash.")

    # 2. Migrate User_Credentials table
    creds = query_all("SELECT credential_id, user_id, username, password_hash FROM User_Credentials")
    cred_migrated_count = 0
    for c in creds:
        pwd = c.get("password_hash") or ""
        if not pwd.startswith(("$2b$", "$2a$", "$2y$")):
            hashed = hash_password(pwd)
            execute_write("UPDATE User_Credentials SET password_hash = ? WHERE credential_id = ?", (hashed, c["credential_id"]))
            cred_migrated_count += 1
            print(f" [MIGRATED] Credential record {c['credential_id']} for user '{c['username']}' hashed.")
        else:
            print(f" [SKIP] Credential record {c['credential_id']} already has bcrypt hash.")

    print(f"\nMigration complete! Total Users hashed: {user_migrated_count}, Total Credentials hashed: {cred_migrated_count}.")

if __name__ == "__main__":
    run_migration()
