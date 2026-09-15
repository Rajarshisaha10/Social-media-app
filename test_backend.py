import sys
from fastapi.testclient import TestClient
from main import app
from db import init_db, query_all, query_one
from routers.sql import PRESET_QUERIES

print("Initializing DB...")
init_db()

tables = query_all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
print(f"Total tables in SQLite: {len(tables)}")
for t in tables:
    count = query_one(f"SELECT COUNT(*) AS c FROM {t['name']}")['c']
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

    # 3. Posts & Hashtags
    r = client.get("/api/posts")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/posts - Count:", r.json()["count"])

    # 4. Users
    r = client.get("/api/users")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/users - Count:", r.json()["count"])

    # 5. Groups
    r = client.get("/api/groups?user_id=1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/groups - Count:", r.json()["count"])

    # 6. Messages
    r = client.get("/api/messages/conversations/1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/messages/conversations/1 - Count:", r.json()["count"])

    # 7. Notifications
    r = client.get("/api/notifications/1")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/notifications/1 - Count:", r.json()["count"])

    # 8. Analytics Overview & Events
    r = client.get("/api/analytics/overview")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/analytics/overview:", r.json()["analytics"])

    r = client.get("/api/analytics/events")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/analytics/events - Count:", r.json()["count"])

    # 9. SQL Studio Execution & Schema
    r = client.get("/api/sql/schema")
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] GET /api/sql/schema - Tables:", r.json()["table_count"])

    r = client.post("/api/sql/execute", json={"query": "SELECT u.username, COUNT(p.post_id) AS post_count FROM Users u LEFT JOIN Post p ON p.user_id = u.user_id GROUP BY u.user_id"})
    assert r.status_code == 200 and r.json()["success"]
    print(" [PASS] POST /api/sql/execute - Query returned:", r.json()["message"])

    print("\nALL BACKEND & API TESTS COMPLETED SUCCESSFULLY! 🎉")
except Exception as e:
    print("Test execution error:", e)
    sys.exit(1)
