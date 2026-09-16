import sys
import time
from fastapi.testclient import TestClient
from main import app
from db import init_db, query_all, query_one
from routers.sql import PRESET_QUERIES

print("Initializing DB...")
init_db()

from db import get_engine

if get_engine() == "mysql":
    tables = query_all("SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'")
else:
    tables = query_all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC")

print(f"Total tables in {get_engine().upper()}: {len(tables)}")
for t in tables:
    count = query_one(f"SELECT COUNT(*) AS c FROM `{t['name']}`")['c']
    print(f" - {t['name']}: {count} rows")

print("\nTesting SQL Presets:")
for p in PRESET_QUERIES:
    res = query_all(p['sql'])
    print(f" [PASS] Preset '{p['title']}': {len(res)} rows returned")

print("\nTesting FastAPI Endpoints via TestClient...")
try:
    client = TestClient(app)
    
    # 1. Info & Root
    r = client.get("/api/info")
    assert r.status_code == 200, f"Info failed: {r.text}"
    print(" [PASS] GET /api/info:", r.json()["status"])

    # 2. UI Root & /sql
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print(" [PASS] GET / (UI HTML served)")

    r = client.get("/sql")
    assert r.status_code == 200, f"/sql failed: {r.text}"
    print(" [PASS] GET /sql (SQL UI HTML served)")

    # 3. PWA Routes
    r = client.get("/manifest.json")
    assert r.status_code == 200, f"Manifest failed: {r.text}"
    print(" [PASS] GET /manifest.json (PWA Manifest served)")

    r = client.get("/sw.js")
    assert r.status_code == 200, f"Service worker failed: {r.text}"
    assert "Service-Worker-Allowed" in r.headers
    print(" [PASS] GET /sw.js (PWA Service Worker served with Service-Worker-Allowed header)")

    for icon_path in ["/icon-192.png", "/icon-512.png", "/favicon.svg"]:
        r = client.get(icon_path)
        assert r.status_code == 200, f"{icon_path} failed: {r.status_code}"
        print(f" [PASS] GET {icon_path} (PWA Icon served)")

    # 4. Authentication: Login with Super Admin rajarshi
    r = client.post("/api/users/login", json={"username": "rajarshi", "password": "dbms108"})
    assert r.status_code == 200 and r.json()["success"]
    admin_user = r.json()["user"]
    assert admin_user["username"] == "rajarshi"
    print(" [PASS] POST /api/users/login (Admin rajarshi):", admin_user["username"])

    # 5. Strict Email Validation
    r_bad_email = client.post("/api/users/register", json={
        "username": "bademail_test",
        "email": "invalid_email_format",
        "password": "password123"
    })
    assert r_bad_email.status_code == 400
    print(" [PASS] Strict Email Validation: Rejected invalid email format successfully.")

    unique_uname = f"dev_{int(time.time())}"
    r_good = client.post("/api/users/register", json={
        "username": unique_uname,
        "email": f"{unique_uname}@socialsphere.io",
        "password": "securepass123",
        "bio": "Automated test user",
        "location": "Cloud",
        "interests": "SQL, Python"
    })
    assert r_good.status_code == 200 and r_good.json()["success"]
    new_user_id = r_good.json()["user"]["user_id"]
    print(" [PASS] POST /api/users/register (Valid Email):", r_good.json()["user"]["username"])

    # 6. Follow / Unfollow Social Graph
    r_follow = client.post(f"/api/users/{new_user_id}/follow", json={"caller_id": 2})
    assert r_follow.status_code == 200 and r_follow.json()["following"] == True
    print(" [PASS] POST /api/users/{id}/follow (Follow Action): following=True")

    r_unfollow = client.post(f"/api/users/{new_user_id}/follow", json={"caller_id": 2})
    assert r_unfollow.status_code == 200 and r_unfollow.json()["following"] == False
    print(" [PASS] POST /api/users/{id}/follow (Unfollow Action): following=False")

    r_followers = client.get(f"/api/users/2/followers")
    assert r_followers.status_code == 200 and r_followers.json()["success"]
    print(" [PASS] GET /api/users/{id}/followers - Count:", r_followers.json()["count"])

    # 7. Privacy: Super Admin rajarshi hidden from regular users
    r_users_public = client.get("/api/users")
    assert r_users_public.status_code == 200
    user_names = [u["username"].lower() for u in r_users_public.json()["users"]]
    assert "rajarshi" not in user_names
    print(" [PASS] Super Admin Privacy: 'rajarshi' hidden from public user directory.")

    rajarshi_uid = query_one("SELECT user_id FROM Users WHERE username = 'rajarshi'")["user_id"]
    r_users_admin = client.get(f"/api/users?viewer_id={rajarshi_uid}")
    assert r_users_admin.status_code == 200
    admin_user_names = [u["username"].lower() for u in r_users_admin.json()["users"]]
    assert "rajarshi" in admin_user_names
    print(" [PASS] Super Admin Directory: 'rajarshi' visible to Super Admin viewer.")

    # 8. Posts & Hashtags
    r = client.get("/api/posts")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/posts - Count:", r.json()["count"])

    # 8b. Post Creation & Deletion
    r_create_post = client.post("/api/posts", json={
        "user_id": new_user_id,
        "content": "Test post for deletion #deleteTest"
    })
    assert r_create_post.status_code == 200 and r_create_post.json()["success"]
    created_post_id = r_create_post.json()["post_id"]
    print(" [PASS] POST /api/posts (Created temporary post):", created_post_id)

    # Permission check: non-author cannot delete
    r_del_unauth = client.delete(f"/api/posts/{created_post_id}?user_id=2")
    assert r_del_unauth.status_code == 403
    print(" [PASS] DELETE /api/posts/{id} (Unauthorized rejected with 403)")

    # Author deletion succeeds
    r_del_auth = client.delete(f"/api/posts/{created_post_id}?user_id={new_user_id}")
    assert r_del_auth.status_code == 200 and r_del_auth.json()["success"]
    print(" [PASS] DELETE /api/posts/{id} (Author deleted post successfully)")

    # Deleting already deleted post returns 404
    r_del_gone = client.delete(f"/api/posts/{created_post_id}?user_id={new_user_id}")
    assert r_del_gone.status_code == 404
    print(" [PASS] DELETE /api/posts/{id} (Already deleted post returns 404)")

    # 9. Groups
    r = client.get("/api/groups?user_id=1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/groups - Count:", r.json()["count"])

    # 10. Messages
    r = client.get("/api/messages/conversations/1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/messages/conversations/1 - Count:", r.json()["count"])

    # 11. Notifications
    r = client.get("/api/notifications/1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/notifications/1 - Count:", r.json()["count"])

    # 12. Analytics Overview & Events
    r = client.get("/api/analytics/overview")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/analytics/overview (Total 17 Tables):", r.json()["analytics"]["totalFollows"], "follows")

    # 13. SQL Studio Execution & Schema
    r = client.get("/api/sql/schema")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/sql/schema - Tables:", r.json()["table_count"])

    r = client.post("/api/sql/execute", json={"query": "SELECT u.username, uc.account_role FROM Users u JOIN User_Credentials uc ON uc.user_id = u.user_id"})
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] POST /api/sql/execute - Query returned:", r.json()["message"])

    print("\nALL BACKEND, PWA, AUTH & FOLLOW TESTS COMPLETED SUCCESSFULLY! 🎉")
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
