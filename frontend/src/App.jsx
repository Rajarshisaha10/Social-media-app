import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import AuthGate from './components/AuthGate';
import Sidebar from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import FeedTab from './components/Feed/FeedTab';
import MessagesTab from './components/Messages/MessagesTab';
import CommunitiesTab from './components/Communities/CommunitiesTab';
import ConnectionsTab from './components/Connections/ConnectionsTab';
import UsersTab from './components/Users/UsersTab';
import SqlStudioTab from './components/SqlStudio/SqlStudioTab';
import AnalyticsTab from './components/Analytics/AnalyticsTab';
import UserProfileModal from './components/Modals/UserProfileModal';
import StoryViewerModal from './components/Modals/StoryViewerModal';
import NotificationsModal from './components/Modals/NotificationsModal';
import CreateGroupModal from './components/Modals/CreateGroupModal';
import ProfileSetupModal from './components/Modals/ProfileSetupModal';
import InstallAppPrompt from './components/InstallAppPrompt';
import NexoMascot from './components/NexoMascot';
import { Bell, Mail, Search } from 'lucide-react';

const DASHBOARD_TIPS = [
  "Welcome back! Let's create something amazing ✨",
  "Tip: Add 3+ images for 2x engagement 📸",
  "Post at 7pm for max reach 🚀",
  "Reply to comments to build your tribe 💬",
  "Try a poll — they get 3x more responses 📊",
  "Your vibe attracts your tribe. Stay authentic 💫",
];

export default function App() {
  const { user, logout, isSuperAdmin, unreadNotifCount, unreadMsgCount, showOnboarding, setShowOnboarding } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.endsWith('/sql')) return 'sql';
    return 'feed';
  });

  // Mascot rotation tips
  const [tipIndex, setTipIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [viewingStoryUser, setViewingStoryUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupsRefreshKey, setGroupsRefreshKey] = useState(0);
  const [chatPartnerId, setChatPartnerId] = useState(null);

  // Sync /sql route
  useEffect(() => {
    if (window.location.pathname.endsWith('/sql') && isSuperAdmin) {
      setActiveTab('sql');
    }
  }, [isSuperAdmin]);

  // Rotate mascot tip every 6s matching index.html
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DASHBOARD_TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (!user) {
    return <AuthGate />;
  }

  const handleStartChatFromProfile = (targetUserId) => {
    setChatPartnerId(targetUserId);
    setActiveTab('messages');
  };

  return (
    <div className="app-container" style={{ background: '#F4F5F9' }}>
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenCreatePost={() => {
          setActiveTab('feed');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Body */}
      <div className="app-main" style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Desktop Sticky Header matching index.html lines 520-544 */}
        <header
          className="desktop-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <div
            onClick={() => setActiveTab('feed')}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <span
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '30px',
                color: 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: '0.5px',
              }}
            >
              Social Sphere
            </span>
          </div>

          <div style={{ flex: 1, maxWidth: '440px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              type="text"
              placeholder="Search Social Sphere creators, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('users');
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#F4F5F9',
                borderRadius: '9999px',
                padding: '10px 16px 10px 42px',
                fontSize: '13.5px',
                border: '1px solid transparent',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.borderColor = '#2563FF';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#F4F5F9';
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4B5563',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Notifications"
            >
              <Bell size={19} />
              {unreadNotifCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FF2D55',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4B5563',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Messages"
            >
              <Mail size={19} />
              {unreadMsgCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FF2D55',
                  }}
                />
              )}
            </button>

            <div
              onClick={() => setViewingProfileId(user.user_id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <img
                src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                alt={user?.username}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0A0E27' }}>
                {user?.username}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Header (small screens) */}
        <MobileHeader
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenMessages={() => setActiveTab('messages')}
        />

        {/* Tab Views */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'feed' && (
            <FeedTab
              onNavigateTab={setActiveTab}
              onSelectStory={(storyUser) => setViewingStoryUser(storyUser)}
              onUserClick={(uid) => setViewingProfileId(uid)}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab initialPartnerId={chatPartnerId} />
          )}

          {activeTab === 'groups' && (
            <CommunitiesTab
              onOpenCreateGroup={() => setShowCreateGroup(true)}
              refreshKey={groupsRefreshKey}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsTab onUserClick={(uid) => setViewingProfileId(uid)} />
          )}

          {activeTab === 'users' && (
            <UsersTab onUserClick={(uid) => setViewingProfileId(uid)} />
          )}

          {activeTab === 'sql' && <SqlStudioTab />}

          {activeTab === 'analytics' && <AnalyticsTab />}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreatePost={() => {
            setActiveTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Floating Nexo Mascot Companion matching index.html lines 702-710 */}
      <div
        id="dashboardMascot"
        className="dashboard-mascot-widget"
        onClick={() => {
          toast.info('Nexo waves at you 👋 Keep creating magic!');
        }}
      >
        <div className="tip-bubble" style={{ maxWidth: '220px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '2px' }}>
            Nexo says:
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0A0E27' }}>
            {DASHBOARD_TIPS[tipIndex]}
          </div>
        </div>
        <div style={{ width: '84px', height: '84px' }}>
          <NexoMascot />
        </div>
      </div>

      {/* Overlays / Modals */}
      {viewingProfileId && (
        <UserProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
          onStartChat={handleStartChatFromProfile}
        />
      )}

      {viewingStoryUser && (
        <StoryViewerModal
          storyUser={viewingStoryUser}
          onClose={() => setViewingStoryUser(null)}
        />
      )}

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          setGroupsRefreshKey((k) => k + 1);
        }}
      />

      <ProfileSetupModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Mobile App Install Prompt */}
      <InstallAppPrompt />
    </div>
  );
}

