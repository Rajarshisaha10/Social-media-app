import React from 'react';
import {
  Home,
  MessageSquare,
  Database,
  Bell,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileHeader({ onOpenNotifications, onOpenMessages }) {
  const { unreadNotifCount, unreadMsgCount, logout } = useAuth();

  return (
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          className="sphere-emblem-glow"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF2D55 0%, #2563FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(37, 99, 255, 0.3)',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-brand)', fontSize: '26px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
          Social Sphere
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onOpenNotifications}
          style={{ padding: '8px', position: 'relative', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          title="Notifications"
          aria-label={unreadNotifCount > 0 ? `Notifications (${unreadNotifCount} unread)` : 'Notifications'}
        >
          <Bell size={22} />
          {unreadNotifCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                background: 'var(--red)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={onOpenMessages}
          style={{ padding: '8px', position: 'relative', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          title="Messages"
          aria-label={unreadMsgCount > 0 ? `Messages (${unreadMsgCount} unread)` : 'Messages'}
        >
          <MessageSquare size={22} />
          {unreadMsgCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                background: 'var(--red)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={logout}
          style={{ padding: '8px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
          title="Log Out"
          aria-label="Log Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav({ activeTab, setActiveTab, onOpenCreatePost, onOpenProfile }) {
  const { user, unreadMsgCount } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
        onClick={() => setActiveTab('feed')}
        title="Home"
        aria-label="Home Feed"
      >
        <Home size={22} />
      </button>

      <button
        className={`mobile-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
        onClick={() => setActiveTab('messages')}
        title="Messages"
        aria-label="Messages"
        style={{ position: 'relative' }}
      >
        <MessageSquare size={22} />
        {unreadMsgCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '18px',
              width: '8px',
              height: '8px',
              background: 'var(--red)',
              borderRadius: '50%',
            }}
          />
        )}
      </button>

      {/* SQL Studio in place of Plus button */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'sql' ? 'active' : ''}`}
        onClick={() => setActiveTab('sql')}
        title="SQL Studio"
        aria-label="SQL Studio"
      >
        <Database size={22} />
      </button>

      <button
        className={`mobile-nav-item ${activeTab === 'connections' ? 'active' : ''}`}
        onClick={() => setActiveTab('connections')}
        title="Connections"
        aria-label="Connections"
      >
        <UserCheck size={22} />
      </button>

      <button
        className="mobile-nav-item"
        onClick={() => onOpenProfile ? onOpenProfile() : setActiveTab('feed')}
        title="Profile"
        aria-label="User Profile"
      >
        <div style={{ padding: '2px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF2D55, #2563FF)' }}>
          <img
            src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={user?.username}
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', display: 'block', background: '#fff' }}
          />
        </div>
      </button>
    </nav>
  );
}
