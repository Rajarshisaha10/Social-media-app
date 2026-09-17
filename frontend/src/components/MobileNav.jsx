import {
  Home,
  Users as UsersIcon,
  Terminal,
  Compass,
  Bell,
  MessageSquare,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileHeader({ onOpenNotifications, onOpenMessages }) {
  const { unreadNotifCount, unreadMsgCount, logout } = useAuth();

  return (
    <header className="mobile-header">
      <div style={{ fontFamily: 'var(--font-brand)', fontSize: '26px', color: 'var(--text-primary)' }}>
        SocialSphere
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
                background: 'var(--red-accent)',
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
                background: 'var(--red-accent)',
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

export function MobileBottomNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();

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
        className={`mobile-nav-item ${activeTab === 'groups' ? 'active' : ''}`}
        onClick={() => setActiveTab('groups')}
        title="Communities"
        aria-label="Communities"
      >
        <UsersIcon size={22} />
      </button>

      <button
        className={`mobile-nav-item ${activeTab === 'sql' ? 'active' : ''}`}
        onClick={() => setActiveTab('sql')}
        title="SQL Queries"
        aria-label="SQL Studio"
      >
        <Terminal size={22} color={activeTab === 'sql' ? 'var(--blue-primary)' : 'currentColor'} />
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
        className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => setActiveTab('users')}
        title="Explore Users"
        aria-label="Explore Users"
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
