# Social Media Analytics Backend (Python / FastAPI / SQLite)

This is a lightweight Python backend built with **FastAPI** and **SQLite**. Zero external database configuration required!

## Features

- **Built-in SQLite**: Uses Python's native `sqlite3` engine.
- **Automatic Initialization**: Automatically creates tables and seeds sample data upon startup.
- **Interactive Documentation**: Auto-generated Swagger UI and ReDoc.
- **CORS Enabled**: Configured for cross-origin frontend communication.

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Server**:
   ```bash
   python main.py
   ```
   or with Uvicorn:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 5000 --reload
   ```

## API Endpoints

- **Root**: `GET /` - Health status message
- **Interactive Swagger Docs**: `GET /docs` (visit `http://localhost:5000/docs` in browser)
- **ReDoc Documentation**: `GET /redoc`
- **Test SQLite Connection**: `GET /api/test-db`
- **Analytics Overview**: `GET /api/analytics/overview` - Returns total count of users, posts, comments, reactions, messages, groups, and recommendations.
- **User Recommendations**: `GET /api/recommendations/{userId}` - Returns friend recommendations for the specified user sorted by score (e.g. `GET /api/recommendations/1`).
