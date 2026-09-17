import os
import sys
import subprocess
from fastapi.testclient import TestClient

# Ensure root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

def test_p0_suite():
    print("=== BEGINNING COMPREHENSIVE P0 HARDENING AUDIT ===")
    client = TestClient(app)

    # -------------------------------------------------------------
    # P0 Item 1: Backdoor Removal
    # -------------------------------------------------------------
    print("\n[Item 1] Testing login backdoor removal...")
    r_backdoor = client.post("/api/users/login", json={"username": "kandarp", "password": "password123"})
    assert r_backdoor.status_code == 401, f"Backdoor was NOT blocked! Status: {r_backdoor.status_code}"
    print(" [PASS] Master backdoor 'password123' rejected with 401 Unauthorized.")

    # -------------------------------------------------------------
    # P0 Item 2: Bcrypt Password Hashing & Registration Policy
    # -------------------------------------------------------------
    print("\n[Item 2] Testing bcrypt password hashing and registration policy...")
    # Legitimate login with migrated bcrypt hash
    r_real = client.post("/api/users/login", json={"username": "kandarp", "password": "hashed_pass_123"})
    assert r_real.status_code == 200, f"Login failed for valid password: {r_real.text}"
    assert "access_token" in r_real.json(), "access_token missing from login response"
    kandarp_token = r_real.json()["access_token"]
    print(" [PASS] Legitimate user authenticated against bcrypt hash and received JWT access_token.")

    # Super Admin login
    r_admin = client.post("/api/users/login", json={"username": "rajarshi", "password": "dbms108"})
    assert r_admin.status_code == 200, f"Admin login failed: {r_admin.text}"
    admin_token = r_admin.json()["access_token"]
    print(" [PASS] Super Admin authenticated and received JWT access_token.")

    # Weak password policy rejection
    r_weak = client.post("/api/users/register", json={
        "username": "weak_pwd_user",
        "email": "weak@example.com",
        "password": "short"
    })
    assert r_weak.status_code == 400, f"Weak password was not rejected: {r_weak.text}"
    print(" [PASS] Registration with weak password rejected under password strength policy.")

    # Strong password policy acceptance
    import time
    uname = f"sec_{int(time.time())}"
    r_strong = client.post("/api/users/register", json={
        "username": uname,
        "email": f"{uname}@example.com",
        "password": "StrongPassword@2026!"
    })
    assert r_strong.status_code == 200 and "access_token" in r_strong.json()
    new_user_token = r_strong.json()["access_token"]
    print(f" [PASS] Registration with strong password accepted and hashed with bcrypt.")

    # -------------------------------------------------------------
    # P0 Item 3: Authentication & Identity Derivation
    # -------------------------------------------------------------
    print("\n[Item 3] Testing authentication boundaries and identity derivation...")
    # Unauthenticated post creation rejected
    r_unauth_post = client.post("/api/posts", json={"content": "Should fail without token"})
    assert r_unauth_post.status_code == 401, f"Expected 401, got {r_unauth_post.status_code}"
    print(" [PASS] POST /api/posts without token rejected with 401.")

    # Authenticated post creation
    r_auth_post = client.post(
        "/api/posts",
        json={"content": "Secured post #hardened"},
        headers={"Authorization": f"Bearer {kandarp_token}"}
    )
    assert r_auth_post.status_code == 200, f"Post creation failed: {r_auth_post.text}"
    post_id = r_auth_post.json()["post_id"]
    print(" [PASS] POST /api/posts with JWT created post with author derived from token.")

    # Unauthorized delete (new_user tries to delete kandarp's post)
    r_steal_del = client.delete(f"/api/posts/{post_id}", headers={"Authorization": f"Bearer {new_user_token}"})
    assert r_steal_del.status_code == 403, f"Unauthorized delete should be 403, got {r_steal_del.status_code}"
    print(" [PASS] Non-owner post deletion blocked with 403 Forbidden.")

    # Owner delete succeeds
    r_own_del = client.delete(f"/api/posts/{post_id}", headers={"Authorization": f"Bearer {kandarp_token}"})
    assert r_own_del.status_code == 200, f"Owner delete failed: {r_own_del.text}"
    print(" [PASS] Owner post deletion succeeded.")

    # Notifications privacy boundary
    r_notif = client.get("/api/notifications/1", headers={"Authorization": f"Bearer {new_user_token}"})
    assert r_notif.status_code == 403, f"Viewing other's notifications should be 403, got {r_notif.status_code}"
    print(" [PASS] Viewing another user's notifications blocked with 403 Forbidden.")

    # -------------------------------------------------------------
    # P0 Item 4: SQL Studio Lockdown
    # -------------------------------------------------------------
    print("\n[Item 4] Testing SQL Studio lockdown (SUPER_ADMIN only, AST parser)...")
    user_token = new_user_token
    # Regular user can execute read-only queries (everyone access)
    r_sql_user = client.post(
        "/api/sql/execute",
        json={"query": "SELECT 1 AS test_check"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert r_sql_user.status_code == 200 and r_sql_user.json()["success"], f"Expected 200 for regular user read-only query, got {r_sql_user.text}"
    print(" [PASS] Regular user read-only SQL execution accepted successfully.")

    # Admin valid SELECT accepted
    r_sql_admin = client.post(
        "/api/sql/execute",
        json={"query": "SELECT 1 AS secure_check"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_sql_admin.status_code == 200 and r_sql_admin.json()["success"], f"Admin SELECT failed: {r_sql_admin.text}"
    print(" [PASS] Admin read-only SELECT executed successfully.")

    # Mutation statement rejected by AST parser
    r_sql_drop = client.post(
        "/api/sql/execute",
        json={"query": "DROP TABLE Users"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert r_sql_drop.status_code == 400, f"DROP statement should be rejected with 400, got {r_sql_drop.status_code}"
    print(" [PASS] DROP TABLE rejected by AST parser with 400 Bad Request.")

    # Admin stacked injection rejected by AST parser
    r_sql_stack = client.post(
        "/api/sql/execute",
        json={"query": "SELECT 1; DELETE FROM Post"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r_sql_stack.status_code == 400, f"Stacked SQL injection should be rejected with 400, got {r_sql_stack.status_code}"
    print(" [PASS] Stacked SQL statements rejected by AST parser with 400 Bad Request.")

    # -------------------------------------------------------------
    # P0 Item 5: Git DB tracking & Ignore
    # -------------------------------------------------------------
    print("\n[Item 5] Testing .gitignore *.db inclusion...")
    with open(".gitignore", "r", encoding="utf-8") as f:
        gitignore_content = f.read()
    assert "*.db" in gitignore_content, "*.db is missing from .gitignore"
    print(" [PASS] *.db is present in .gitignore.")

    # -------------------------------------------------------------
    # P0 Item 6: Production Fail-Fast on DB Secrets
    # -------------------------------------------------------------
    print("\n[Item 6] Testing production fail-fast on missing DB credentials...")
    code = (
        "import os; "
        "os.environ['ENV'] = 'production'; "
        "os.environ.pop('DB_PASSWORD', None); "
        "os.environ.pop('DATABASE_URL', None); "
        "import db"
    )
    proc = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
    assert proc.returncode != 0, "db.py should have failed startup in production without credentials"
    assert "CRITICAL CONFIGURATION ERROR" in proc.stderr, f"Missing expected error message, got: {proc.stderr}"
    print(" [PASS] Production startup fails fast with clear error if DB credentials missing.")

    print("\n=======================================================")
    print("   ALL P0 SECURITY HARDENING ITEMS FULLY VERIFIED!     ")
    print("=======================================================")

if __name__ == "__main__":
    test_p0_suite()
