import React from 'react';
import {
  Home,
  MessageSquare,
  Users as UsersIcon,
  Compass,
  Database,
  BarChart3,
  LogOut,
  UserCheck,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { user, logout, isSuperAdmin, unreadNotifCount, unreadMsgCount } = useAuth();

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-logo">SocialSphere</div>

        <nav className="sidebar-nav">
          <button
            className={`nav-link-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            className={`nav-link-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={20} />
            <span>Messages</span>
            {unreadMsgCount > 0 && <span className="nav-badge">{unreadMsgCount}</span>}
          </button>

          <button
            className={`nav-link-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <UsersIcon size={20} />
            <span>Communities</span>
          </button>

          <button
            className={`nav-link-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            <UserCheck size={20} />
            <span>Connections</span>
          </button>

          <button
            className={`nav-link-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Compass size={20} />
            <span>Explore Users</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                className={`nav-link-btn ${activeTab === 'sql' ? 'active' : ''}`}
                onClick={() => setActiveTab('sql')}
              >
                <Database size={20} />
                <span>/sql Studio</span>
                <span className="admin-pill-tag">ADMIN</span>
              </button>

              <button
                className={`nav-link-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 size={20} />
                <span>Analytics</span>
                <span className="admin-pill-tag">ADMIN</span>
              </button>
            </>
          )}

          <button
            className="nav-link-btn"
            onClick={onOpenCreatePost}
            style={{ marginTop: '10px', color: 'var(--blue-primary)', fontWeight: 600 }}
          >
            <Terminal size={20} />
            <span>SQL Queries</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-bar">
          <img
            src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={user?.username}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className="meta">
            <span className="uname">{user?.username}</span>
            <span className="urole">
              {isSuperAdmin ? 'Super Administrator' : (user?.location || 'Member')}
            </span>
          </div>
          <button
            className="logout-icon-btn"
            onClick={logout}
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
