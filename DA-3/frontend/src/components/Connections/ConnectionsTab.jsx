import React, { useState, useEffect } from 'react';
import { UserCheck, Sparkles, Network, LayoutGrid } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import GraphVisualizer from './GraphVisualizer';

export default function ConnectionsTab({ onUserClick }) {
  const { user, followingSet, toggleFollow } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('graph'); // default to 'graph' for the teacher demo!

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
      {/* Header and View Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--gold-accent)" />
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Graph Connections & Recommendations</h2>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Powered by <strong>Neo4j AuraDB</strong> graph traversals and bio topic affinity.
          </p>
        </div>

        {/* View switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'graph' ? 'var(--blue-primary)' : 'transparent',
              color: viewMode === 'graph' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Network size={16} />
            <span>Interactive Graph Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'grid' ? 'var(--blue-primary)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutGrid size={16} />
            <span>Suggested Cards</span>
          </button>
        </div>
      </div>

      {/* Render Graph Visualizer Studio or Grid */}
      {viewMode === 'graph' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GraphVisualizer onUserClick={onUserClick} />
          
          <div className="aside-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎓</span> Teacher Demo Highlights
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>⚡ 1. Index-Free Adjacency</strong>
                Relational DBs (like SQL) require costly multi-table <code style={{ color: 'var(--blue-primary)' }}>JOIN</code> operations. Neo4j stores pointers directly on node records, traversing millions of connections in microseconds.
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>🕸️ 2. Two-Hop Traversal Demo</strong>
                Click <strong>" Explain to Teacher"</strong> above to see animated photon pulses travel through shared <code style={{ color: '#10b981' }}>:Topic</code> nodes extracted from bio keywords.
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>📊 3. Live AuraDB Cloud Sync</strong>
                All nodes, follows, and topic affinities are queried in real time directly from our remote Neo4j AuraDB instance.
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
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
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '34px', marginTop: '2px', lineHeight: '1.4' }}>
                  {recBio || recInterests || 'SocialSphere member'}
                </p>

                {rec.SharedTopics && rec.SharedTopics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', margin: '4px 0' }}>
                    {rec.SharedTopics.slice(0, 2).map((t, i) => (
                      <span key={i} style={{ fontSize: '10.5px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

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
