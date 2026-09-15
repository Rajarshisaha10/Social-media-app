import {
  Home,
  Users as UsersIcon,
  Terminal,
  Database,
  Compass,
  Bell,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileHeader({ onOpenNotifications, onOpenMessages }) {
  const { unreadNotifCount, unreadMsgCount, logout } = useAuth();

  return (
    <header className="mobile-header">
      <div style={{ fontFamily: 'var(--font-brand)', fontSize: '26px', color: 'var(--text-primary)' }}>
        SocialSphere
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenNotifications}
          style={{ padding: '6px', position: 'relative', color: 'var(--text-primary)' }}
          title="Notifications"
        >
          <Bell size={22} />
          {unreadNotifCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: 'var(--red-accent)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={onOpenMessages}
          style={{ padding: '6px', position: 'relative', color: 'var(--text-primary)' }}
          title="Messages"
        >
          <MessageSquare size={22} />
          {unreadMsgCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: 'var(--red-accent)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>
        <button
          onClick={logout}
          style={{ padding: '6px', color: 'var(--text-secondary)' }}
          title="Log Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { isSuperAdmin, user } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
        onClick={() => setActiveTab('feed')}
        title="Home"
      >
        <Home size={22} />
      </button>

      <button
        className={`mobile-nav-item ${activeTab === 'groups' ? 'active' : ''}`}
        onClick={() => setActiveTab('groups')}
        title="Communities"
      >
        <UsersIcon size={22} />
      </button>

      <button
        className="mobile-nav-item"
        onClick={onOpenCreatePost}
        title="SQL Queries"
      >
        <Terminal size={24} color="var(--blue-primary)" />
      </button>

      {isSuperAdmin ? (
        <button
          className={`mobile-nav-item ${activeTab === 'sql' ? 'active' : ''}`}
          onClick={() => setActiveTab('sql')}
          title="SQL Studio"
        >
          <Database size={22} />
        </button>
      ) : (
        <button
          className={`mobile-nav-item ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
          title="Connections"
        >
          <UsersIcon size={22} />
        </button>
      )}

      <button
        className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => setActiveTab('users')}
        title="Explore"
      >
        <img
          src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
          alt={user?.username}
          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
        />
      </button>
    </nav>
  );
}
