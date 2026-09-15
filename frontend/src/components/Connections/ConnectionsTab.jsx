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
            <div key={n} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="aside-card" style={{ textAlign: 'center', padding: '40px' }}>
          <UserCheck size={36} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <h3>No suggestions found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Check back later as new members join and expand the social graph!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
          {recommendations.map((rec) => {
            const isFollowing = followingSet.has(rec.user_id);
            return (
              <div
                key={rec.user_id}
                className="aside-card animate-fade-in"
                style={{ alignItems: 'center', textAlign: 'center', padding: '20px' }}
              >
                <img
                  src={rec.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt={rec.username}
                  onClick={() => onUserClick?.(rec.user_id)}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
                <h4
                  onClick={() => onUserClick?.(rec.user_id)}
                  style={{ fontWeight: 800, fontSize: '15px', marginTop: '10px', cursor: 'pointer' }}
                >
                  {rec.username}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '32px', marginTop: '2px' }}>
                  {rec.interests?.split(',').slice(0, 2).join(', ') || rec.bio || 'SocialSphere member'}
                </p>

                {rec.score && (
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
                    Match {Math.round(rec.score * 100)}%
                  </span>
                )}

                <button
                  type="button"
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={() => toggleFollow(rec.user_id)}
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
