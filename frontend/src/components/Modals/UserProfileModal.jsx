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
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="skeleton" style={{ height: '80px', borderRadius: '50%', width: '80px', margin: '0 auto' }} />
            <div className="skeleton" style={{ height: '24px', width: '50%', margin: '0 auto' }} />
            <div className="skeleton" style={{ height: '60px', width: '100%' }} />
          </div>
        ) : profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
            <img
              src={profile.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={profile.username}
              style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }}
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
                  style={{ flex: 1, height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <MessageSquare size={15} />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>User not found</div>
        )}
      </div>
    </div>
  );
}
