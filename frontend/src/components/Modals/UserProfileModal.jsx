import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function UserProfileModal({ userId, onClose, onStartChat }) {
  const { user, followingSet, toggleFollow } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getUserProfile(userId, user?.user_id);
        if (data?.user) {
          setProfile(data.user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) load();
  }, [userId, user?.user_id]);

  if (!userId) return null;

  const isSelf = user?.user_id === userId;
  const isFollowing = followingSet.has(userId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close profile">
          <X size={18} />
        </button>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
            <div className="skeleton skeleton-avatar" style={{ height: '84px', width: '84px' }} />
            <div className="skeleton skeleton-bar" style={{ height: '18px', width: '140px' }} />
            <div className="skeleton skeleton-bar" style={{ height: '12px', width: '90px' }} />
            <div className="skeleton skeleton-bar" style={{ height: '36px', width: '80%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', padding: '12px 0' }}>
              <div className="skeleton skeleton-bar" style={{ height: '28px', width: '50px' }} />
              <div className="skeleton skeleton-bar" style={{ height: '28px', width: '50px' }} />
              <div className="skeleton skeleton-bar" style={{ height: '28px', width: '50px' }} />
            </div>
          </div>
        ) : profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
            <img
              src={profile.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={profile.username}
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--shadow-card)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{profile.username}</h3>
                {profile.admin_level === 'SUPER_ADMIN' && (
                  <span className="admin-pill-tag">SUPER ADMIN</span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {profile.location || 'Global Member'}
              </p>
              {profile.bio && (
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px', fontStyle: 'italic' }}>
                  "{profile.bio}"
                </p>
              )}
            </div>

            {/* Stats Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                width: '100%',
                padding: '12px 0',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                margin: '8px 0',
              }}
            >
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>{profile.posts_count || 0}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posts</span>
              </div>
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>{profile.followers_count || 0}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Followers</span>
              </div>
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>{profile.following_count || 0}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Following</span>
              </div>
            </div>

            {/* Action Buttons */}
            {!isSelf && (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={() => toggleFollow(userId)}
                  aria-label={isFollowing ? `Unfollow ${profile.username}` : `Follow ${profile.username}`}
                  style={{ flex: 1, height: '38px' }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onClose();
                    onStartChat?.(userId);
                  }}
                  aria-label={`Send direct message to ${profile.username}`}
                  style={{ flex: 1, height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <MessageSquare size={15} />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Member not found</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
              This profile could not be loaded or may no longer exist.
            </p>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
