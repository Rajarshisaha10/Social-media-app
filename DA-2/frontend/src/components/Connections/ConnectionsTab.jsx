import React, { useState, useEffect } from 'react';
import { UserCheck, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ConnectionsTab({ onUserClick }) {
  const { user, followingSet, toggleFollow } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.user_id) return;
      try {
        const data = await api.getRecommendations(user.user_id);
        if (data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.user_id]);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 20px 60px', width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--gold-accent)" />
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Suggested Connections</h2>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          People you may know based on mutual topics, graph scoring, and relational recommendations.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aside-card" style={{ alignItems: 'center', textAlign: 'center', padding: '20px', gap: 10 }}>
              <div className="skeleton skeleton-avatar" style={{ width: 72, height: 72 }} />
              <div className="skeleton skeleton-bar" style={{ width: 110, height: 16, marginTop: 4 }} />
              <div className="skeleton skeleton-bar" style={{ width: 150, height: 12 }} />
              <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 'var(--radius-full)', margin: '4px 0' }} />
              <div className="skeleton" style={{ width: '100%', height: 34, borderRadius: 'var(--radius-full)', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="aside-card" style={{ textAlign: 'center', padding: '48px 24px', alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <UserCheck size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800 }}>No suggestions found right now</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '380px', marginTop: '6px', lineHeight: '1.5' }}>
            As you interact with posts and join communities, people you may know will appear here based on mutual topics and relational recommendations.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
          {recommendations.map((rec) => {
            const recUserId = rec.RecommendedUserID || rec.user_id;
            const isFollowing = followingSet.has(recUserId);
            const recUsername = rec.Username || rec.username;
            const recProfilePic = rec.ProfilePic || rec.profile_pic;
            const recInterests = rec.Interests || rec.interests;
            const recBio = rec.Bio || rec.bio;
            const recScore = rec.Score || rec.score;
            return (
              <div
                key={recUserId}
                className="aside-card"
                style={{ alignItems: 'center', textAlign: 'center', padding: '20px' }}
              >
                <img
                  src={recProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt={recUsername}
                  onClick={() => onUserClick?.(recUserId)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile for ${recUsername}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onUserClick?.(recUserId);
                    }
                  }}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-card)',
                  }}
                />
                <h4
                  onClick={() => onUserClick?.(recUserId)}
                  style={{ fontWeight: 800, fontSize: '15px', marginTop: '10px', cursor: 'pointer' }}
                >
                  {recUsername}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '32px', marginTop: '2px' }}>
                  {recInterests?.split(',').slice(0, 2).join(', ') || recBio || 'SocialSphere member'}
                </p>

                {recScore && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--blue-primary)',
                      background: 'var(--blue-light)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      margin: '6px 0 10px',
                    }}
                  >
                    Match {Math.round(recScore * 100)}%
                  </span>
                )}

                <button
                  type="button"
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={() => toggleFollow(recUserId)}
                  aria-label={isFollowing ? `Unfollow ${recUsername}` : `Follow ${recUsername}`}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
