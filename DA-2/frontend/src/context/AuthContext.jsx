import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('socialsphere_token');
      const saved = localStorage.getItem('socialsphere_user');
      if (!token || !saved) {
        localStorage.removeItem('socialsphere_token');
        localStorage.removeItem('socialsphere_user');
        setAuthToken(null);
        return null;
      }
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [followingSet, setFollowingSet] = useState(new Set());
  const [usersList, setUsersList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isSuperAdmin = Boolean(
    user && (user.username?.toLowerCase() === 'rajarshi' || user.admin_level === 'SUPER_ADMIN')
  );

  // Listen for 401 unauthorized events from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setFollowingSet(new Set());
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Validate saved session token with server on initial mount
  useEffect(() => {
    const token = localStorage.getItem('socialsphere_token');
    const saved = localStorage.getItem('socialsphere_user');
    if (token && saved) {
      api.getCurrentUser()
        .then((res) => {
          if (res?.user) {
            setUser((prev) => (prev ? { ...prev, ...res.user } : res.user));
          }
        })
        .catch((err) => {
          console.warn('Saved session validation failed:', err);
          setUser(null);
          setAuthToken(null);
          localStorage.removeItem('socialsphere_user');
          localStorage.removeItem('socialsphere_token');
        });
    }
  }, []);

  // Load user's following list and explore users
  const refreshUsersAndFollowing = useCallback(async (currentUserId) => {
    if (!currentUserId) return;
    try {
      const usersData = await api.getUsers(currentUserId);
      if (usersData?.users) {
        setUsersList(usersData.users);
      }

      // Check following relationships
      const prof = await api.getUserProfile(currentUserId, currentUserId);
      // Backend does not have a bulk following endpoint, but we can query each or maintain in set
      // For immediate reactivity, we initialize from local storage or profile if available
      const savedFollows = localStorage.getItem(`follows_${currentUserId}`);
      if (savedFollows) {
        setFollowingSet(new Set(JSON.parse(savedFollows)));
      }
    } catch (err) {
      console.warn('Failed to load user graph:', err);
    }
  }, []);

  // Check notifications
  const checkNotifications = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const data = await api.getNotifications(user.user_id);
      if (data?.notifications) {
        setUnreadNotifCount(data.notifications.length);
      }
    } catch (err) {
      console.warn('Notification check failed:', err);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('socialsphere_user', JSON.stringify(user));
      refreshUsersAndFollowing(user.user_id);
      checkNotifications();
    } else {
      localStorage.removeItem('socialsphere_user');
      setFollowingSet(new Set());
    }
  }, [user, refreshUsersAndFollowing, checkNotifications]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res?.success && res.user) {
      if (res.access_token || res.token) {
        setAuthToken(res.access_token || res.token);
      }
      const userWithTime = {
        ...res.user,
        login_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setUser(userWithTime);

      // Trigger profile setup if user hasn't completed it and hasn't skipped
      const skipped = localStorage.getItem(`profile_setup_skipped_${res.user.user_id}`);
      const isDefaultBio = !res.user.bio || res.user.bio === 'SocialSphere Member';
      const isDefaultLoc = !res.user.location || res.user.location === 'Global';
      if (!skipped && (isDefaultBio || isDefaultLoc)) {
        setShowOnboarding(true);
      }

      return userWithTime;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res?.success && res.user) {
      if (res.access_token || res.token) {
        setAuthToken(res.access_token || res.token);
      }
      const userWithTime = {
        ...res.user,
        login_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setUser(userWithTime);
      // New registered user: immediately invite them to complete their profile
      setShowOnboarding(true);
      return userWithTime;
    }
    throw new Error(res?.message || 'Registration failed');
  };

  const updateUserProfile = async ({ bio, location, interests, profilePic }) => {
    const res = await api.updateProfile({ bio, location, interests, profilePic });
    if (res?.success && res.user) {
      const updatedUser = {
        ...user,
        ...res.user,
      };
      setUser(updatedUser);
      localStorage.setItem('socialsphere_user', JSON.stringify(updatedUser));
      setShowOnboarding(false);
      return updatedUser;
    }
    throw new Error(res?.message || 'Profile update failed');
  };

  const logout = async () => {
    if (user?.user_id) {
      try {
        await api.logout(user.user_id);
      } catch (err) {
        console.warn('Logout API failed:', err);
      }
    }
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('socialsphere_user');
    localStorage.removeItem('socialsphere_token');
    setFollowingSet(new Set());
  };

  // 0ms Optimistic Follow / Unfollow
  const toggleFollow = async (targetUserId) => {
    if (!user?.user_id || user.user_id === targetUserId) return;
    const isCurrentlyFollowing = followingSet.has(targetUserId);

    // Optimistic toggle
    const nextSet = new Set(followingSet);
    if (isCurrentlyFollowing) {
      nextSet.delete(targetUserId);
    } else {
      nextSet.add(targetUserId);
    }
    setFollowingSet(nextSet);
    localStorage.setItem(`follows_${user.user_id}`, JSON.stringify([...nextSet]));

    try {
      if (isCurrentlyFollowing) {
        await api.unfollowUser(targetUserId, user.user_id);
      } else {
        await api.followUser(targetUserId, user.user_id);
      }
    } catch (err) {
      // Rollback on error
      console.error('Follow action failed, rolling back:', err);
      setFollowingSet(followingSet);
      localStorage.setItem(`follows_${user.user_id}`, JSON.stringify([...followingSet]));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        isSuperAdmin,
        followingSet,
        toggleFollow,
        usersList,
        unreadNotifCount,
        unreadMsgCount,
        setUnreadMsgCount,
        refreshUsersAndFollowing,
        checkNotifications,
        showOnboarding,
        setShowOnboarding,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
