import React from 'react';
import { Database, ArrowRight, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RightSidebar({
  suggestedUsers = [],
  communities = [],
  onNavigateTab,
  onUserClick,
}) {
  const { user, isSuperAdmin, followingSet, toggleFollow } = useAuth();

  return (
    <aside className="feed-aside">
      {/* Self Profile Banner */}
      <div className="aside-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
        <img
          src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
          alt={user?.username}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '14.5px' }}>{user?.username}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isSuperAdmin ? 'Super Admin' : (user?.location || 'Member')}
          </div>
        </div>
      </div>

      {/* Suggested Connections */}
      <div className="aside-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="aside-card-title">Suggested for you</span>
          <button
            type="button"
            className="btn-text-sm"
            style={{ fontSize: '12px', color: 'var(--blue-primary)', fontWeight: 700 }}
            onClick={() => onNavigateTab('connections')}
          >
            See All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestedUsers.slice(0, 4).map((su) => {
            const isFollowing = followingSet.has(su.user_id);
            return (
              <div key={su.user_id} className="user-snippet-row">
                <div
                  className="user-snippet-left"
                  onClick={() => onUserClick?.(su.user_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={su.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                    alt={su.username}
                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {su.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {su.interests?.split(',')[0] || 'Member'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn-follow ${isFollowing ? 'following' : ''}`}
                  onClick={() => toggleFollow(su.user_id)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Communities */}
      <div className="aside-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="aside-card-title">Communities</span>
          <button
            type="button"
            className="btn-text-sm"
            style={{ fontSize: '12px', color: 'var(--blue-primary)', fontWeight: 700 }}
            onClick={() => onNavigateTab('groups')}
          >
            Explore
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {communities.slice(0, 3).map((grp) => (
            <div
              key={grp.group_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-secondary)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {grp.group_name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {grp.member_count || 1} members
                </div>
              </div>
              <button
                type="button"
                className="btn-text-sm"
                onClick={() => onNavigateTab('groups')}
                style={{ color: 'var(--blue-primary)', fontWeight: 600, fontSize: '11px' }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Studio Promo for Super Admin */}
      {isSuperAdmin && (
        <div
          className="aside-card"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)',
            color: '#fff',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} color="#60a5fa" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd', letterSpacing: '0.5px' }}>
              DATABASE WORKBENCH
            </span>
          </div>
          <div>
            <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
              Relational /sql Studio
            </h5>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
              Execute live queries against SQLite with millisecond timing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('sql')}
            style={{
              background: '#fff',
              color: '#1e3a8a',
              fontWeight: 700,
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>Launch Studio</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Footer Info */}
      <footer style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <p>SocialSphere &middot; React + Vite Ultra-Fast Engine</p>
        <p>&copy; 2026 SOCIALSPHERE</p>
      </footer>
    </aside>
  );
}
