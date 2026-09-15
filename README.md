# ⚡ SocialSphere - Fullstack Social Media & SQL Studio Platform

A modern social media web platform and database exploration suite powered by **Python FastAPI** and **SQLite** with **15 relational database tables**, real-time direct messaging, community groups, algorithmic recommendations, live telemetry audit logs, and an interactive **/sql Studio**.

---

## 🌟 Key Features

1. **📱 Mobile-First Responsive Design**:
   - Modern dark-mode glassmorphic aesthetic with fluid layouts.
   - Fixed bottom navigation bar on mobile phones (`Feed`, `Chat`, `Groups`, `/sql`, `Stats`, `Members`).
   - Touch-friendly action sheets, avatars, reaction bars, and modals.

2. **🗄️ Full 15-Table Relational Schema Integration**:
   - `Users`, `Profile_Pic`, `Regular_User`, `Admin_User` (User Profiles & Directory)
   - `Post`, `Comment`, `Reaction` (Interactive Feed with Like/Love/Fire reactions & nested comments)
   - `Community_Group`, `Group_Members` (Communities directory with join/leave and creator admin roles)
   - `Hashtag`, `Post_Hashtag` (Automatic `#tag` parsing, discovery bar, and filtered feeds)
   - `Message` (Direct Messaging & live chat thread between users)
   - `Notification` (Live notifications center with unread indicator)
   - `Friend_Recommendation` (Compatibility scoring & match cards)
   - `Event_Analysis` (Audit trail & telemetry stream tracking logins, posts, reactions, etc.)

3. **💻 Interactive `/sql` Studio Page**:
   - Direct route accessible at `/sql` and in the navigation.
   - Real-time SQL execution engine against SQLite with millisecond timing (`⏱️ ms`).
   - Schema Inspector displaying all 15 tables, column types, primary keys, and row counts.
   - 8+ curated preset queries for instant data exploration.
   - CSV and JSON export buttons for query result sets.
   - Keyboard shortcut: `Ctrl + Enter` / `Cmd + Enter` to execute.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python main.py
```
Or with Uvicorn:
```bash
uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```

### 3. Open in Browser
- **Web App**: [http://localhost:5000](http://localhost:5000)
- **SQL Studio**: [http://localhost:5000/sql](http://localhost:5000/sql)
- **Interactive Swagger Docs**: [http://localhost:5000/docs](http://localhost:5000/docs)

---

## ☁️ Deployment on Render

This repository is pre-configured for seamless deployment to **[Render](https://render.com)**.

### Option A: 1-Click / Blueprint Deployment (`render.yaml`)
1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, click **New +** -> **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and configure the web service.

### Option B: Manual Web Service Setup
1. In Render, click **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the following settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Deploy Web Service**.

> The SQLite database will be automatically created and seeded with sample data on startup.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/info` | API health and system info |
| `GET` | `/api/posts` | Feed posts with reactions, comments, and hashtags |
| `POST` | `/api/posts` | Create new post (auto-extracts hashtags) |
| `POST` | `/api/posts/{id}/react` | Add/toggle reaction (LIKE, LOVE, FIRE) |
| `POST` | `/api/posts/{id}/comments` | Add comment or reply |
| `GET` | `/api/users` | List all platform members with profiles |
| `GET` | `/api/groups` | Community groups with membership rosters |
| `POST` | `/api/groups` | Create new community group |
| `POST` | `/api/groups/{id}/toggle-join` | Join/leave group |
| `GET` | `/api/messages/conversations/{user_id}` | Active chat conversations |
| `GET` | `/api/messages/thread/{u1}/{u2}` | Message thread history |
| `POST` | `/api/messages` | Send direct message |
| `GET` | `/api/recommendations/{user_id}` | Friend recommendations |
| `GET` | `/api/notifications/{user_id}` | User notifications |
| `GET` | `/api/analytics/overview` | 15-table entity counters |
| `GET` | `/api/analytics/events` | Telemetry & event audit log |
| `GET` | `/api/analytics/hashtags` | Trending hashtags cloud |
| `POST` | `/api/sql/execute` | Execute raw SQL query |
| `GET` | `/api/sql/schema` | Complete SQLite table metadata |
| `GET` | `/api/sql/presets` | Curated sample SQL queries |
