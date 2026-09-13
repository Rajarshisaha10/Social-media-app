import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import init_db, query_all
from routers.analytics import router as analytics_router
from routers.recommendations import router as recommendations_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables on startup
    init_db()
    yield

app = FastAPI(
    title="Social Media Analytics API",
    description="Python FastAPI backend with SQLite database",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations_router)
app.include_router(analytics_router)

@app.get("/")
def read_root():
    return {
        "message": "Social Media Analytics API is running (SQLite)"
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

if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
