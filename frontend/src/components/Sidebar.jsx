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
    <aside className="app-sidebar" style={{ background: '#FFFFFF', borderRight: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Brand Logo with previous Grand Hotel font */}
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
            className="sphere-emblem-glow"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF2D55 0%, #2563FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(37, 99, 255, 0.3)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '32px',
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '0.5px',
            }}
          >
            Social Sphere
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
              fontWeight: activeTab === 'feed' ? 700 : 500,
              background: activeTab === 'feed' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'feed' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('feed')}
          >
            <Home size={19} color={activeTab === 'feed' ? '#2563FF' : '#4B5563'} />
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
              fontWeight: activeTab === 'messages' ? 700 : 500,
              background: activeTab === 'messages' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'messages' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={19} color={activeTab === 'messages' ? '#2563FF' : '#4B5563'} />
            <span style={{ flex: 1, textAlign: 'left' }}>Messages</span>
            {unreadMsgCount > 0 && (
              <span
                style={{
                  background: '#FF2D55',
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
              fontWeight: activeTab === 'groups' ? 700 : 500,
              background: activeTab === 'groups' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'groups' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('groups')}
          >
            <UsersIcon size={19} color={activeTab === 'groups' ? '#2563FF' : '#4B5563'} />
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
              fontWeight: activeTab === 'connections' ? 700 : 500,
              background: activeTab === 'connections' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'connections' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('connections')}
          >
            <UserCheck size={19} color={activeTab === 'connections' ? '#2563FF' : '#4B5563'} />
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
              fontWeight: activeTab === 'users' ? 700 : 500,
              background: activeTab === 'users' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'users' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('users')}
          >
            <Compass size={19} color={activeTab === 'users' ? '#2563FF' : '#4B5563'} />
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
              fontWeight: activeTab === 'sql' ? 700 : 500,
              background: activeTab === 'sql' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'sql' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('sql')}
          >
            <Database size={19} color={activeTab === 'sql' ? '#2563FF' : '#4B5563'} />
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
              fontWeight: activeTab === 'analytics' ? 700 : 500,
              background: activeTab === 'analytics' ? '#E5EDFF' : 'transparent',
              color: activeTab === 'analytics' ? '#2563FF' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={19} color={activeTab === 'analytics' ? '#2563FF' : '#4B5563'} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Primary Create Post Button from index.html */}
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
            fontWeight: 700,
          }}
        >
          <PlusCircle size={17} />
          <span>Create post</span>
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
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: '#0A0E27',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.username}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isSuperAdmin ? 'Super Admin' : (user?.location || 'Creator')}
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
              color: '#6B7280',
              background: '#F4F5F9',
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

