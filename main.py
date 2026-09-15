import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from db import init_db, query_all
from routers.analytics import router as analytics_router
from routers.recommendations import router as recommendations_router
from routers.posts import router as posts_router
from routers.users import router as users_router
from routers.groups import router as groups_router
from routers.messages import router as messages_router
from routers.notifications import router as notifications_router
from routers.sql import router as sql_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize SQLite database tables on startup
    init_db()
    yield

app = FastAPI(
    title="SocialSphere — Social & SQL Studio API",
    description="Fullstack FastAPI backend with SQLite database, 16 relational tables, user credentials store, PWA caching, live SQL Studio, and mobile dashboard",
    version="1.2.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers for all features
app.include_router(posts_router)
app.include_router(users_router)
app.include_router(recommendations_router)
app.include_router(analytics_router)
app.include_router(groups_router)
app.include_router(messages_router)
app.include_router(notifications_router)
app.include_router(sql_router)

@app.get("/api/info")
def read_info():
    return {
        "name": "Social Media Analytics API",
        "status": "online",
        "database": "SQLite",
        "pwa": "enabled",
        "docs_url": "/docs",
        "sql_studio_url": "/sql"
    }

@app.get("/api/test-db")
def test_db_connection():
    try:
        rows = query_all("SELECT 1 AS connected")
        return {
            "success": True,
            "message": "SQLite connection successful",
            "data": rows
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "SQLite connection failed",
                "error": str(error)
            }
        )

# Mount static directory for frontend UI
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# PWA Service Worker & Manifest Routes
@app.get("/manifest.json")
def serve_manifest():
    manifest_file = os.path.join(static_dir, "manifest.json")
    if os.path.exists(manifest_file):
        return FileResponse(manifest_file, media_type="application/manifest+json")
    raise HTTPException(status_code=404, detail="Manifest not found")

@app.get("/sw.js")
def serve_service_worker():
    sw_file = os.path.join(static_dir, "sw.js")
    if os.path.exists(sw_file):
        return FileResponse(
            sw_file,
            media_type="application/javascript",
            headers={"Service-Worker-Allowed": "/"}
        )
    raise HTTPException(status_code=404, detail="Service worker not found")

@app.get("/")
def serve_ui():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Social Media Platform API is running. Visit /docs for API documentation."}

@app.get("/sql")
def serve_sql_ui():
    """Route specifically for /sql page, serving the main web app with SQL Studio activated."""
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "SQL Studio page available. Please check static files."}

if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"\n🚀 Server starting...")
    print(f"👉 Open in browser: http://localhost:{port} or http://127.0.0.1:{port}")
    print(f"👉 SQL Studio: http://localhost:{port}/sql")
    print(f"👉 Swagger API Docs: http://localhost:{port}/docs")
    print(f"👉 PWA Manifest: http://localhost:{port}/manifest.json\n")
    uvicorn.run("main:app", host=host, port=port, reload=True)
