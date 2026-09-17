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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { user, logout, isSuperAdmin, unreadNotifCount, unreadMsgCount } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

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

          <button
            className={`nav-link-btn ${activeTab === 'sql' ? 'active' : ''}`}
            onClick={() => setActiveTab('sql')}
          >
            <Database size={20} />
            <span>SQL Queries</span>
          </button>

          <button
            className={`nav-link-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        {/* Modern Theme Switcher */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Theme
          </span>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Warm Cream Light Mode' : 'Switch to Midnight Obsidian Dark Mode'}
            aria-label="Toggle Color Theme"
          >
            {isDark ? <Sun size={14} color="var(--gold-accent)" /> : <Moon size={14} color="var(--blue-primary)" />}
            <span>{isDark ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        <div className="user-profile-bar">
          <img
            src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={user?.username}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div className="meta">
            <span className="uname">{user?.username}</span>
            <div className="urole" style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span>{isSuperAdmin ? 'Super Administrator' : (user?.location || 'Member')}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {user?.login_time ? `Logged in: ${user.login_time}` : (user?.last_login ? `Logged in: ${user.last_login}` : 'Active session')}
              </span>
            </div>
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
