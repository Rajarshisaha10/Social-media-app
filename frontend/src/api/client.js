// API Client for SocialSphere Backend
const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '';

let authToken = localStorage.getItem('socialsphere_token') || '';

export const setAuthToken = (token) => {
  authToken = token || '';
  if (token) {
    localStorage.setItem('socialsphere_token', token);
  } else {
    localStorage.removeItem('socialsphere_token');
  }
};

export const getAuthToken = () => authToken;

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${res.status}`;
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (payload) =>
    request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request('/api/users/me'),

  updateProfile: ({ bio, location, interests, profilePic }) =>
    request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        bio,
        location,
        interests,
        profile_pic: profilePic,
      }),
    }),

  logout: (userId) =>
    request('/api/users/logout', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Users
  getUsers: (viewerId) =>
    request(`/api/users${viewerId ? `?viewer_id=${viewerId}` : ''}`),

  getUserProfile: (userId, viewerId) =>
    request(`/api/users/${userId}${viewerId ? `?viewer_id=${viewerId}` : ''}`),

  followUser: (targetUserId, callerId) =>
    request(`/api/users/${targetUserId}/follow`, {
      method: 'POST',
      body: JSON.stringify(callerId ? { caller_id: callerId } : {}),
    }),

  unfollowUser: (targetUserId, callerId) =>
    request(`/api/users/${targetUserId}/unfollow`, {
      method: 'POST',
      body: JSON.stringify(callerId ? { caller_id: callerId } : {}),
    }),

  // Posts
  getPosts: ({ tag, userId, viewerId } = {}) => {
    const params = new URLSearchParams();
    if (tag) params.append('tag', tag);
    if (userId) params.append('user_id', userId);
    if (viewerId) params.append('viewer_id', viewerId);
    const query = params.toString();
    return request(`/api/posts${query ? `?${query}` : ''}`);
  },

  createPost: ({ userId, content, imageUrl }) =>
    request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, content, url: imageUrl }),
    }),

  reactToPost: ({ postId, userId, reactionType }) =>
    request(`/api/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, reaction_type: reactionType }),
    }),

  addComment: ({ postId, userId, content }) =>
    request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, content }),
    }),

  deletePost: ({ postId, userId }) =>
    request(`/api/posts/${postId}${userId ? `?user_id=${userId}` : ''}`, {
      method: 'DELETE',
    }),

  getHashtags: () => request('/api/analytics/hashtags'),

  // Communities / Groups
  getGroups: (viewerId) =>
    request(`/api/groups${viewerId ? `?viewer_id=${viewerId}` : ''}`),

  createGroup: ({ name, description, privacy, creatorId }) =>
    request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({
        group_name: name,
        description,
        privacy_setting: privacy,
        user_id: creatorId,
      }),
    }),

  toggleJoinGroup: (groupId, userId) =>
    request(`/api/groups/${groupId}/toggle-join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Messages
  getConversations: (userId) =>
    request(userId ? `/api/messages/conversations/${userId}` : '/api/messages/conversations'),

  getChatThread: (u1, u2) =>
    request(u2 !== undefined ? `/api/messages/thread/${u1}/${u2}` : `/api/messages/thread/${u1}`),

  sendMessage: ({ senderId, receiverId, content }) =>
    request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      }),
    }),

  // Recommendations
  getRecommendations: (userId) =>
    request(userId ? `/api/recommendations/${userId}` : '/api/recommendations'),

  // Notifications
  getNotifications: (userId) =>
    request(userId ? `/api/notifications/${userId}` : '/api/notifications'),

  dismissNotification: (notifId) =>
    request(`/api/notifications/${notifId}`, {
      method: 'DELETE',
    }),

  // SQL Studio (Admin)
  getSqlPresets: () => request('/api/sql/presets'),
  getSqlSchema: () => request('/api/sql/schema'),
  executeSql: (query, userId) =>
    request('/api/sql/execute', {
      method: 'POST',
      body: JSON.stringify({ query, user_id: userId }),
    }),

  // Analytics (Admin)
  getAnalyticsOverview: () => request('/api/analytics/overview'),
  getAnalyticsEvents: () => request('/api/analytics/events'),
};
