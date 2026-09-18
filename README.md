# 🌐 SocialSphere

### Full-Stack Social Networking Platform with Integrated SQL Studio & Analytics

SocialSphere is a full-stack social networking platform that combines modern social networking features with relational database management, SQL exploration, recommendations, and analytics.

The platform allows users to create accounts, manage profiles, publish posts, interact with content, follow other users, join communities, exchange direct messages, receive notifications, and discover suggested connections.

It also includes an integrated **SQL Studio** for exploring database schemas, browsing tables, executing SQL queries, analyzing relational data, and exporting query results.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, JavaScript, CSS
- **Backend**: Python, FastAPI
- **Authentication**: JWT, BCrypt
- **Database**: MySQL, SQLite
- **API**: RESTful API
- **Deployment**: Render

---

##  Features

###  User Authentication

- User registration and login
- JWT-based authentication
- BCrypt password hashing
- Protected routes
- Role-based access control
- Server-side authentication validation

###  User Profiles

- Create and manage profiles
- Bio and interests
- Location information
- Profile pictures
- Account status
- User discovery

###  Social Feed

- Create and manage posts
- View social content
- Hashtag support
- Content sharing
- Feed activity tracking

###  Engagement

- Likes and reactions
- Comments
- Nested replies
- Reaction tracking
- Post engagement analysis

###  Social Networking

- Follow and unfollow users
- Build social connections
- Discover users
- Suggested connections
- Social relationship tracking

###  Recommendation System

SocialSphere includes a recommendation system for discovering potential connections.

The recommendation system uses:

- Mutual interests
- Social relationships
- Graph-based scoring
- Relationship analysis
- User interaction data

###  Communities

- Create communities
- Public and private communities
- Join communities
- Manage memberships
- Membership roles
- Community activity tracking

###  Messaging

- One-to-one messaging
- Conversation history
- Sender and receiver tracking
- Read-status tracking

###  Notifications

Notifications are generated for activities such as:

- Likes and reactions
- Comments
- Follows
- Community activity
- Recommended connections

###  Analytics

The analytics system tracks:

- User activity
- Login events
- Post engagement
- Platform interactions
- Community participation
- Device information
- Event metadata

###  SQL Studio

Integrated database exploration environment with:

- SQL Query Runner
- Schema Explorer
- Data Dictionary
- Table Browser
- Database Analytics
- CSV Export
- JSON Export

---

## 🏗️ Architecture

```mermaid
flowchart TD
    A[React.js Frontend] --> B[FastAPI REST API]

    B --> C[Authentication]
    B --> D[Posts & Engagement]
    B --> E[Communities]
    B --> F[Messaging]
    B --> G[Notifications]
    B --> H[Recommendation Engine]
    B --> I[Analytics]
    B --> J[SQL Studio]

    C --> K[(Database Layer)]
    D --> K
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K

    K --> L[(MySQL)]
    K --> M[(SQLite)]
🗄️ Database Design
SocialSphere uses a relational database architecture consisting of 17 core tables, 81+ schema fields, and 176+ records supporting application functionality, relationships, recommendations, and analytics.

Core Tables
Table	Purpose
Users	Stores core user information
User_Credentials	Stores authentication credentials
Regular_User	Stores regular-user information
Admin_User	Stores administrator information
Profile_Pic	Stores profile picture references
Post	Stores user-created posts
Comment	Stores comments and nested replies
Reaction	Stores reactions to posts and comments
Hashtag	Stores hashtags
Post_Hashtag	Links posts with hashtags
User_Follow	Stores follower/following relationships
Community_Group	Stores community information
Group_Members	Stores community memberships
Message	Stores direct messages
Notification	Stores user notifications
Friend_Recommendation	Stores suggested connections
Event_Analysis	Stores analytical events

Database Relationships
Diagram options



Database Statistics
Metric	Value
Core Tables	17
Schema Fields	81+
Records	176+

Database Resources

schema_mysql.sql
schema_sqlite.sql
klouds_full_deploy.sql
social_media.db
🔌 API Routes Summary
The FastAPI backend provides RESTful services for authentication, users, posts, communities, messaging, notifications, recommendations, analytics, and SQL Studio.

Module	Functionality
Authentication	Registration, login, JWT authentication
Users & Profiles	User information and profile management
Posts	Create, retrieve, update, and manage posts
Comments	Comments and nested replies
Reactions	Likes and post reactions
Follows	Follow relationships
Communities	Community creation and management
Memberships	Community membership management
Messaging	Direct messages and conversations
Notifications	Social activity notifications
Recommendations	Suggested user connections
Analytics	Platform activity and engagement analysis
SQL Studio	SQL queries, schema exploration, and data export

FastAPI provides interactive API documentation during local development:

http://localhost:8000/docs

📁 Repository Structure

Social-media-app/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── routers/
│   └── API route modules
│
├── scripts/
│   └── Project scripts
│
├── static/
│   └── Static application resources
│
├── .env.example
├── .gitignore
├── auth.py
├── db.py
├── export_cloud_sql.py
├── generate_icons.py
├── klouds.yaml
├── klouds_full_deploy.sql
├── main.py
├── package.json
├── package-lock.json
├── Procfile
├── requirements.txt
├── schema_mysql.sql
├── schema_sqlite.sql
├── social_media.db
├── structure.txt
├── test_backend.py
└── README.md
⚙️ Setup & How to Run
Prerequisites
Make sure the following are installed:

Git

Python 3.9+

Node.js

npm

MySQL

Step 1: Clone the Repository
Bash

git clone https://github.com/Rajarthshisaha10/Social-media-app.git
cd Social-media-app
Step 2: Backend Setup
Create a Python virtual environment:

Bash

python -m venv venv
Windows
Bash

venv\Scripts\activate
macOS / Linux
Bash

source venv/bin/activate
Install the backend dependencies:

Bash

pip install -r requirements.txt
Step 3: Configure Environment Variables
The repository contains an environment configuration template:


.env.example
Create your local .env configuration based on the variables required by the application.

Keep sensitive information such as database credentials and authentication secrets outside source control.

Important: Never commit passwords, JWT secrets, API keys, or other private credentials to GitHub.

Step 4: Database Setup
SocialSphere supports MySQL and SQLite.

The repository contains the following database resources:


schema_mysql.sql
schema_sqlite.sql
klouds_full_deploy.sql
social_media.db
Configure the database connection using the application's environment configuration.

Step 5: Run the Backend
From the project root:

Bash

uvicorn main:app --reload
Backend:


http://localhost:8000
Interactive API documentation:


http://localhost:8000/docs
Step 6: Run the Frontend
Open a new terminal:

Bash

cd frontend
Install dependencies:

Bash

npm install
Start the development server:

Bash

npm run dev
Vite will display the local frontend URL in the terminal.

Step 7: Production Build
Create a production build:

Bash

npm run build
Preview the production build:

Bash

npm run preview
🔒 Security
SocialSphere incorporates multiple security mechanisms:

JWT-based authentication

BCrypt password hashing

Protected API routes

Role-based access control

Server-side authentication validation

Environment-based secrets

CORS configuration

Input validation

Protected database credentials

SQL Studio should be restricted to authorized users in production environments.

☁️ Deployment
SocialSphere is deployed using Render.

Live Application
https://social-media-app-xice.onrender.com

The repository includes deployment configuration such as:


Procfile
klouds.yaml
The backend can be started in production using:

Bash

uvicorn main:app --host 0.0.0.0 --port $PORT
Deployment Checklist
Configure production database

Set secure JWT secret

Configure CORS

Configure frontend API URL

Enable HTTPS

Configure database permissions

Protect SQL Studio

Configure application logging

🧪 Testing
Backend testing support is included through:


test_backend.py
The test suite can be executed within the configured Python development environment.

📈 Project Highlights
SocialSphere demonstrates a complete full-stack application combining:

React.js and Vite frontend development

Python and FastAPI backend development

REST API architecture

JWT authentication

BCrypt password security

Relational database design

MySQL and SQLite support

Social networking functionality

Community management

Direct messaging

Notification system

Recommendation engine

Activity analytics

SQL query execution

Database schema exploration

CSV and JSON data export

Cloud deployment

🔮 Future Enhancements
Real-time messaging using WebSockets

Push notifications

Advanced recommendation algorithms

Personalized feed ranking

Full-text search

Enhanced media uploads

Community moderation

Advanced administration dashboard

Redis caching

Expanded automated testing

CI/CD pipeline

Docker support

Database migration tooling

SQL query history

Saved SQL queries

Advanced database visualization

