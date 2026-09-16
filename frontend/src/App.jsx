import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
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
import InstallAppPrompt from './components/InstallAppPrompt';

export default function App() {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.endsWith('/sql')) return 'sql';
    return 'feed';
  });

  // Modals state
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [viewingStoryUser, setViewingStoryUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState(null);

  // Sync /sql route
  useEffect(() => {
    if (window.location.pathname.endsWith('/sql') && isSuperAdmin) {
      setActiveTab('sql');
    }
  }, [isSuperAdmin]);

  if (!user) {
    return <AuthGate />;
  }

  const handleStartChatFromProfile = (targetUserId) => {
    setChatPartnerId(targetUserId);
    setActiveTab('messages');
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreatePost={() => {
          setActiveTab('feed');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Body */}
      <div className="app-main">
        {/* Mobile Header */}
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
            <CommunitiesTab onOpenCreateGroup={() => setShowCreateGroup(true)} />
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
          // If in groups tab, user will see newly created group
        }}
      />

      {/* Mobile App Install Prompt */}
      <InstallAppPrompt />
    </div>
  );
}
