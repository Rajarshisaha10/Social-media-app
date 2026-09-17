import React, { useState, useEffect, useRef } from 'react';
import { Heart, Flame, MessageCircle, Send, Trash2, Share2, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import ImageLightboxModal from '../Modals/ImageLightboxModal';

function timeAgo(dateStr) {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseReactionCounts(postData) {
  const counts = { LIKE: 0, LOVE: 0, FIRE: 0, LAUGH: 0, WOW: 0 };
  if (postData.reactions && Array.isArray(postData.reactions)) {
    postData.reactions.forEach((r) => {
      const type = (r.reaction_type || '').toUpperCase();
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts[type] = 1;
      }
    });
  } else if (postData.likes_count !== undefined) {
    counts.LIKE = postData.likes_count || 0;
  }
  return counts;
}

function parseUserReactions(postData, currentUserId) {
  const set = new Set();
  if (postData.reactions && Array.isArray(postData.reactions) && currentUserId) {
    postData.reactions.forEach((r) => {
      if (r.user_id === currentUserId) {
        set.add(r.reaction_type?.toUpperCase());
      }
    });
  }
  return set;
}

export default function PostCard({ post, onTagClick, onUserClick, onDeletePost }) {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  // Optimistic reactions state
  const [reactions, setReactions] = useState(() => parseReactionCounts(post));
  const [userReactions, setUserReactions] = useState(() => parseUserReactions(post, user?.user_id));

  // Comments state
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [burstingReaction, setBurstingReaction] = useState(null);

  const canDelete = Boolean(user && (user.user_id === post.user_id || isSuperAdmin));

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (deleting) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    setDeleting(true);
    try {
      if (onDeletePost) {
        await onDeletePost(post.post_id);
      } else {
        await api.deletePost({ postId: post.post_id, userId: user?.user_id });
      }
      toast.success('Post removed successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Could not delete post: ' + (err.message || 'Server error'));
      setDeleting(false);
    }
  };

  // Silently sync reactions, like counts, and comments whenever updated data arrives from the 10-sec poll or refresh
  useEffect(() => {
    setReactions(parseReactionCounts(post));
    setUserReactions(parseUserReactions(post, user?.user_id));

    if (post.comments && Array.isArray(post.comments)) {
      setComments((prev) => {
        // Preserve any pending optimistic comments that have not resolved yet
        const pending = prev.filter((c) => String(c.comment_id).startsWith('temp-'));
        const serverCommentIds = new Set(post.comments.map((c) => c.comment_id));
        const unresolvedPending = pending.filter((c) => !serverCommentIds.has(c.comment_id));
        return [...post.comments, ...unresolvedPending];
      });
    }
  }, [post.reactions, post.reaction_count, post.likes_count, post.comments, post.comment_count, user?.user_id]);

  // 0ms Optimistic Reaction Toggle with Single Memorable Reaction Burst Motion
  const handleToggleReaction = async (type) => {
    if (!user?.user_id) return;
    const isReacted = userReactions.has(type);

    // Instant local state update
    const nextUserReactions = new Set(userReactions);
    const nextCounts = { ...reactions };

    if (isReacted) {
      nextUserReactions.delete(type);
      nextCounts[type] = Math.max(0, (nextCounts[type] || 0) - 1);
    } else {
      nextUserReactions.add(type);
      nextCounts[type] = (nextCounts[type] || 0) + 1;
      setBurstingReaction(type);
      setTimeout(() => setBurstingReaction(null), 360);
    }

    setUserReactions(nextUserReactions);
    setReactions(nextCounts);

    // Call API in background
    try {
      await api.reactToPost({
        postId: post.post_id,
        userId: user.user_id,
        reactionType: type,
      });
    } catch (err) {
      // Rollback on network failure
      console.error('Failed to update reaction:', err);
      setUserReactions(userReactions);
      setReactions(reactions);
    }
  };

  // 0ms Optimistic Comment Submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user?.user_id) return;

    const newComment = {
      comment_id: `temp-${Date.now()}`,
      post_id: post.post_id,
      user_id: user.user_id,
      username: user.username,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    setCommentText('');
    setSubmittingComment(true);

    try {
      await api.addComment({
        postId: post.post_id,
        userId: user.user_id,
        content: newComment.content,
      });
      toast.success('Comment posted!');
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast.error('Failed to post comment');
      // Remove temporary comment on failure
      setComments((prev) => prev.filter((c) => c.comment_id !== newComment.comment_id));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/#post-${post.post_id}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      toast.info('Post link copied to clipboard! 📋');
    } catch {
      toast.info(`Post #${post.post_id} ready to share`);
    }
  };

  // Format content with clickable hashtags
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onTagClick?.(tag);
            }}
            style={{
              color: 'var(--blue-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: '2px',
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const displayedComments = showAllComments ? comments : comments.slice(-3);

  return (
    <article className="post-card">
      <header className="post-header">
        <div
          className="post-author-group"
          onClick={() => onUserClick?.(post.user_id)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick?.(post.user_id);
            }
          }}
          aria-label={`View profile for ${post.username || 'User'}`}
        >
          <img
            className="post-author-avatar"
            src={post.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={post.username}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="post-author-uname">{post.username || 'User'}</span>
              {post.username?.toLowerCase() === 'rajarshi' && (
                <span className="admin-pill-tag">SUPER ADMIN</span>
              )}
            </div>
            <span className="post-timestamp">
              {timeAgo(post.created_at || post.created_date)}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            className="post-delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            title={isSuperAdmin && user?.user_id !== post.user_id ? "Delete post (Super Admin)" : "Delete post"}
            aria-label="Delete post"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {post.content && (
        <div className="post-content-text">
          {renderFormattedContent(post.content)}
        </div>
      )}

      {post.image_url && (
        <div
          className="post-media-box"
          onClick={() => setShowLightbox(true)}
          style={{ cursor: 'zoom-in' }}
          title="Click to zoom image"
        >
          <img
            className="post-media-img"
            src={post.image_url}
            alt="Post content"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Reactions Bar */}
      <div className="post-reactions-bar">
        <div
          className="reaction-wrapper"
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
        >
          <button
            type="button"
            className={`reaction-btn ${userReactions.has('LIKE') ? 'reacted-like' : ''} ${burstingReaction === 'LIKE' ? 'bursting' : ''}`}
            onClick={() => handleToggleReaction('LIKE')}
            title={userReactions.has('LIKE') ? 'Unlike' : 'Like'}
            aria-label={`${reactions.LIKE} likes`}
          >
            <Heart size={16} fill={userReactions.has('LIKE') ? 'currentColor' : 'none'} />
            <span>{reactions.LIKE}</span>
          </button>

          {showPopover && (
            <div className="reaction-popover" role="toolbar" aria-label="Reaction options">
              <button
                type="button"
                className="reaction-popover-item"
                onClick={() => { handleToggleReaction('LIKE'); setShowPopover(false); }}
                title="Like"
              >
                👍
              </button>
              <button
                type="button"
                className="reaction-popover-item"
                onClick={() => { handleToggleReaction('LOVE'); setShowPopover(false); }}
                title="Love"
              >
                ❤️
              </button>
              <button
                type="button"
                className="reaction-popover-item"
                onClick={() => { handleToggleReaction('FIRE'); setShowPopover(false); }}
                title="Fire"
              >
                🔥
              </button>
              <button
                type="button"
                className="reaction-popover-item"
                onClick={() => { handleToggleReaction('LAUGH'); setShowPopover(false); }}
                title="Laugh"
              >
                😂
              </button>
              <button
                type="button"
                className="reaction-popover-item"
                onClick={() => { handleToggleReaction('WOW'); setShowPopover(false); }}
                title="Wow"
              >
                🤯
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`reaction-btn ${userReactions.has('FIRE') ? 'reacted-fire' : ''} ${burstingReaction === 'FIRE' ? 'bursting' : ''}`}
          onClick={() => handleToggleReaction('FIRE')}
          title={userReactions.has('FIRE') ? 'Remove fire' : 'Fire'}
          aria-label={`${reactions.FIRE} fire reactions`}
        >
          <Flame size={16} fill={userReactions.has('FIRE') ? 'currentColor' : 'none'} />
          <span>{reactions.FIRE}</span>
        </button>

        <button
          type="button"
          className={`reaction-btn ${userReactions.has('LOVE') ? 'reacted-love' : ''} ${burstingReaction === 'LOVE' ? 'bursting' : ''}`}
          onClick={() => handleToggleReaction('LOVE')}
          title={userReactions.has('LOVE') ? 'Remove love' : 'Love'}
          aria-label={`${reactions.LOVE} love reactions`}
        >
          <Heart size={16} fill={userReactions.has('LOVE') ? 'currentColor' : 'none'} color="#db2777" />
          <span>{reactions.LOVE}</span>
        </button>

        {((reactions.LAUGH || 0) > 0 || userReactions.has('LAUGH')) && (
          <button
            type="button"
            className={`reaction-btn ${userReactions.has('LAUGH') ? 'reacted-like' : ''} ${burstingReaction === 'LAUGH' ? 'bursting' : ''}`}
            onClick={() => handleToggleReaction('LAUGH')}
            title="Laugh"
            aria-label={`${reactions.LAUGH} laugh reactions`}
          >
            <span>😂</span>
            <span>{reactions.LAUGH}</span>
          </button>
        )}

        {((reactions.WOW || 0) > 0 || userReactions.has('WOW')) && (
          <button
            type="button"
            className={`reaction-btn ${userReactions.has('WOW') ? 'reacted-fire' : ''} ${burstingReaction === 'WOW' ? 'bursting' : ''}`}
            onClick={() => handleToggleReaction('WOW')}
            title="Wow"
            aria-label={`${reactions.WOW} wow reactions`}
          >
            <span>🤯</span>
            <span>{reactions.WOW}</span>
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={handleShare}
            title="Share post link"
            aria-label="Share post"
            style={{ padding: '4px', display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
          >
            <Share2 size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MessageCircle size={15} />
            <span>{comments.length}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="post-comments-section">
        {comments.length > 3 && !showAllComments && (
          <button
            type="button"
            className="btn-text-sm"
            onClick={() => setShowAllComments(true)}
            style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}
          >
            View all {comments.length} comments
          </button>
        )}

        {displayedComments.map((c) => (
          <div key={c.comment_id} className="comment-item">
            <span
              className="comment-uname"
              onClick={() => onUserClick?.(c.user_id)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUserClick?.(c.user_id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {c.username}:
            </span>
            <span>{c.content}</span>
          </div>
        ))}

        <form onSubmit={handleAddComment} className="add-comment-row">
          <input
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            aria-label="Add a comment"
          />
          <button
            type="submit"
            className="btn-post-comment"
            disabled={!commentText.trim() || submittingComment}
            title="Post comment"
            aria-label="Post comment"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      {showLightbox && post.image_url && (
        <ImageLightboxModal
          imageUrl={post.image_url}
          caption={post.content}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </article>
  );
}
