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
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenCreatePost, onOpenNotifications }) {
  const { user, logout, isSuperAdmin, unreadNotifCount, unreadMsgCount } = useAuth();

  return (
    <aside className="app-sidebar" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Brand Logo with Fraunces serif */}
        <div
          className="sidebar-logo"
          onClick={() => setActiveTab('feed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '8px 12px 16px',
            margin: 0,
          }}
        >
          <div
            className="brand__mark"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(194, 107, 77, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--clay)',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 21c0-5 3-9 8-10-1 6-4 10-8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M12 21c0-5-3-9-8-10 1 6 4 10 8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M12 21V11" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '28px',
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            gather
          </span>
        </div>

        {/* Navigation Pills */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'feed' ? 600 : 500,
              background: activeTab === 'feed' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'feed' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('feed')}
          >
            <Home size={19} color={activeTab === 'feed' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'messages' ? 600 : 500,
              background: activeTab === 'messages' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'messages' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={19} color={activeTab === 'messages' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span style={{ flex: 1, textAlign: 'left' }}>Messages</span>
            {unreadMsgCount > 0 && (
              <span
                style={{
                  background: 'var(--clay)',
                  color: '#fff',
                  borderRadius: '9999px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {unreadMsgCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'groups' ? 600 : 500,
              background: activeTab === 'groups' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'groups' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('groups')}
          >
            <UsersIcon size={19} color={activeTab === 'groups' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>Communities</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'connections' ? 600 : 500,
              background: activeTab === 'connections' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'connections' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('connections')}
          >
            <UserCheck size={19} color={activeTab === 'connections' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>Connections</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'users' ? 600 : 500,
              background: activeTab === 'users' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'users' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('users')}
          >
            <Compass size={19} color={activeTab === 'users' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>Explore</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'sql' ? 600 : 500,
              background: activeTab === 'sql' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'sql' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('sql')}
          >
            <Database size={19} color={activeTab === 'sql' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>SQL Studio</span>
          </button>

          <button
            type="button"
            className="nav-link-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'analytics' ? 600 : 500,
              background: activeTab === 'analytics' ? 'var(--blue-light)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--clay-deep)' : 'var(--ink-soft)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={19} color={activeTab === 'analytics' ? 'var(--clay-deep)' : 'var(--ink-soft)'} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Primary Create Post Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenCreatePost}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '9999px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <PlusCircle size={17} />
          <span>New note</span>
        </button>
      </div>

      {/* User Session Footer Card */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div className="story-ring" style={{ padding: '2px', borderRadius: '50%' }}>
              <img
                src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={user?.username}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isSuperAdmin ? 'Super Admin' : (user?.location || 'Quiet Collector')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-soft)',
              background: 'var(--bg-elevated)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

