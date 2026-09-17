import React, { useState, useEffect, useCallback } from 'react';
import { Tag, X, RefreshCw } from 'lucide-react';
import StoriesTray from './StoriesTray';
import CreatePostBox from './CreatePostBox';
import PostCard from './PostCard';
import RightSidebar from './RightSidebar';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function FeedTab({ onNavigateTab, onSelectStory, onUserClick }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [communities, setCommunities] = useState([]);

  // Fetch posts with optional hashtag filter
  const fetchPosts = useCallback(async (tag = null) => {
    try {
      const data = await api.getPosts({ tag, viewerId: user?.user_id });
      if (data?.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  }, [user?.user_id]);

  // Initial load + silent auto-refresh every 10 seconds
  useEffect(() => {
    let mounted = true;
    async function loadData(isInitial = false) {
      if (isInitial && posts.length === 0) setLoading(true);
      try {
        const [postsRes, tagsRes, recsRes, groupsRes] = await Promise.allSettled([
          api.getPosts({ tag: activeTag, viewerId: user?.user_id }),
          api.getHashtags(),
          user?.user_id ? api.getRecommendations(user.user_id) : Promise.resolve(null),
          api.getGroups(user?.user_id),
        ]);

        if (!mounted) return;

        if (postsRes.status === 'fulfilled' && postsRes.value?.posts) {
          setPosts(postsRes.value.posts);
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value?.hashtags) {
          setHashtags(tagsRes.value.hashtags);
        }
        if (recsRes.status === 'fulfilled' && recsRes.value?.recommendations) {
          setSuggestedUsers(recsRes.value.recommendations);
        }
        if (groupsRes.status === 'fulfilled' && groupsRes.value?.groups) {
          setCommunities(groupsRes.value.groups);
        }
      } finally {
        if (mounted && isInitial) setLoading(false);
      }
    }

    loadData(posts.length === 0);
    const interval = setInterval(() => loadData(false), 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user?.user_id, activeTag]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [postsRes, tagsRes] = await Promise.allSettled([
        api.getPosts({ tag: activeTag, viewerId: user?.user_id }),
        api.getHashtags(),
      ]);
      if (postsRes.status === 'fulfilled' && postsRes.value?.posts) {
        setPosts(postsRes.value.posts);
      }
      if (tagsRes.status === 'fulfilled' && tagsRes.value?.hashtags) {
        setHashtags(tagsRes.value.hashtags);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleTagFilter = (tag) => {
    const nextTag = activeTag === tag ? null : tag;
    setActiveTag(nextTag);
    fetchPosts(nextTag);
  };

  // 0ms Optimistic Post Creation
  const handleCreatePost = async ({ content, imageUrl }) => {
    const tempPost = {
      post_id: `temp-${Date.now()}`,
      user_id: user.user_id,
      username: user.username,
      profile_pic: user.profile_pic,
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      likes_count: 0,
      reactions: [],
      comments: [],
    };

    // Instant insertion at top
    setPosts((prev) => [tempPost, ...prev]);

    try {
      const res = await api.createPost({
        userId: user.user_id,
        content,
        imageUrl,
      });

      // Update with server generated id if available
      if (res?.post) {
        setPosts((prev) => prev.map((p) => (p.post_id === tempPost.post_id ? res.post : p)));
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      setPosts((prev) => prev.filter((p) => p.post_id !== tempPost.post_id));
      throw err;
    }
  };

  // Optimistic post deletion
  const handleDeletePost = async (postId) => {
    const originalPosts = posts;
    setPosts((prev) => prev.filter((p) => p.post_id !== postId));

    try {
      await api.deletePost({ postId, userId: user?.user_id });
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Could not delete post: ' + (err.message || 'Server error'));
      setPosts(originalPosts);
    }
  };

  return (
    <div className="feed-layout">
      <div className="feed-column">
        {/* Stories Tray */}
        <StoriesTray
          users={suggestedUsers.length > 0 ? suggestedUsers : (posts.map(p => ({ user_id: p.user_id, username: p.username, profile_pic: p.profile_pic })))}
          onSelectStory={onSelectStory}
        />

        {/* Create Post Section */}
        <CreatePostBox onPostCreated={handleCreatePost} />

        {/* Topic / Hashtag Discovery Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
              <Tag size={13} />
              <span>TRENDING TOPICS</span>
            </div>
            <button
              type="button"
              className="btn-text-sm"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="hashtag-filter-bar">
            {hashtags.slice(0, 8).map((h) => {
              const tag = h.tag_name || h.hashtag;
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  className={`hashtag-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleTagFilter(tag)}
                >
                  #{tag} {h.post_count ? `(${h.post_count})` : ''}
                </button>
              );
            })}
          </div>

          {activeTag && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--blue-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                color: 'var(--blue-primary)',
              }}
            >
              <span>Filtering by <strong>#{activeTag}</strong></span>
              <button
                type="button"
                onClick={() => handleTagFilter(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--blue-primary)', fontWeight: 600 }}
              >
                <X size={14} />
                <span>Clear filter</span>
              </button>
            </div>
          )}
        </div>

        {/* Top Reloading Markup: Visible indicator while preserving all screen content */}
        {refreshing && (
          <div className="feed-reloading-badge">
            <RefreshCw size={13} className="animate-spin" />
            <span>Reloading latest updates...</span>
          </div>
        )}

        {/* Posts Feed Stream */}
        {loading && posts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2].map((n) => (
              <div key={n} className="skeleton-post-card">
                <div className="skeleton-post-header">
                  <div className="skeleton skeleton-avatar" style={{ width: 38, height: 38 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton skeleton-bar" style={{ width: 110, height: 13 }} />
                    <div className="skeleton skeleton-bar" style={{ width: 60, height: 10 }} />
                  </div>
                </div>
                <div className="skeleton-post-content">
                  <div className="skeleton skeleton-bar" style={{ width: '100%', height: 14 }} />
                  <div className="skeleton skeleton-bar" style={{ width: '78%', height: 14 }} />
                </div>
                <div className="skeleton skeleton-post-media" />
                <div className="skeleton-post-actions">
                  <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 'var(--radius-full)' }} />
                  <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 'var(--radius-full)' }} />
                  <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="aside-card"
            style={{ textAlign: 'center', padding: '48px 24px', alignItems: 'center' }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-full)',
                background: 'var(--blue-light)',
                color: 'var(--blue-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Tag size={22} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
              {activeTag ? `No posts tagged #${activeTag}` : 'No posts in the sphere yet'}
            </h3>
            <p style={{ marginTop: '6px', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: '1.5' }}>
              {activeTag
                ? `No discussions have been tagged with #${activeTag} yet. Clear the tag to explore all updates or post one now.`
                : 'Be the first to share an update, start a developer discussion, or post a question with the community.'}
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              {activeTag ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleTagFilter(null)}
                >
                  Clear topic filter
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const el = document.querySelector('.create-input-box');
                    if (el) {
                      el.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  Write the first post
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {posts.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                onTagClick={handleTagFilter}
                onUserClick={onUserClick}
                onDeletePost={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <RightSidebar
        suggestedUsers={suggestedUsers}
        communities={communities}
        onNavigateTab={onNavigateTab}
        onUserClick={onUserClick}
      />
    </div>
  );
}
