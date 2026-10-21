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
    <header className="mobile-header" style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          className="brand__mark"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(194, 107, 77, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--clay)',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 21c0-5 3-9 8-10-1 6-4 10-8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M12 21c0-5-3-9-8-10 1 6 4 10 8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M12 21V11" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-brand)', fontSize: '24px', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          gather
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onOpenNotifications}
          style={{ padding: '8px', position: 'relative', color: 'var(--ink-soft)', borderRadius: 'var(--radius-sm)' }}
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
                background: 'var(--clay)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={onOpenMessages}
          style={{ padding: '8px', position: 'relative', color: 'var(--ink-soft)', borderRadius: 'var(--radius-sm)' }}
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
                background: 'var(--clay)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={logout}
          style={{ padding: '8px', color: 'var(--ink-mute)', borderRadius: 'var(--radius-sm)' }}
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
    <nav className="mobile-bottom-nav" style={{ background: 'var(--bg-glass)', borderTop: '1px solid var(--border)' }}>
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
              background: 'var(--clay)',
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
        <div style={{ padding: '2px', borderRadius: '50%', background: 'var(--story-gradient)' }}>
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

