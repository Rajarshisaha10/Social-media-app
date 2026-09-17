import React from 'react';
import { Database, ArrowRight, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RightSidebar({
  suggestedUsers = [],
  communities = [],
  onNavigateTab,
  onUserClick,
  onTagClick,
}) {
  const { user, isSuperAdmin, followingSet, toggleFollow } = useAuth();

  return (
    <aside className="feed-aside" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px', flexShrink: 0 }}>

      {/* Who to Follow Card matching index.html */}
      <div
        className="card"
        style={{
          padding: '20px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 4px 20px -4px rgba(10, 14, 39, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: '#0A0E27' }}>
            Who to follow
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('users')}
            style={{ fontSize: '12px', color: '#2563FF', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            See all
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {suggestedUsers.slice(0, 4).map((su) => {
            const suUserId = su.RecommendedUserID || su.user_id;
            const suUsername = su.Username || su.username;
            const suProfilePic = su.ProfilePic || su.profile_pic;
            const suInterests = su.Interests || su.interests;
            const isFollowing = followingSet.has(suUserId);

            return (
              <div key={suUserId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div
                  onClick={() => onUserClick?.(suUserId)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0, flex: 1 }}
                >
                  <img
                    src={suProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                    alt={suUsername}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        color: '#0A0E27',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {suUsername}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#6B7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      @{suUsername?.toLowerCase()} · {suInterests?.split(',')[0] || 'Creator'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFollow(suUserId)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: isFollowing ? '#F4F5F9' : '#0A0E27',
                    color: isFollowing ? '#4B5563' : '#FFFFFF',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Communities Card */}
      <div
        className="card"
        style={{
          padding: '20px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 4px 20px -4px rgba(10, 14, 39, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: '#0A0E27' }}>
            Communities
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('groups')}
            style={{ fontSize: '12px', color: '#2563FF', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Explore
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {communities.slice(0, 3).map((grp) => (
            <div
              key={grp.group_id}
              onClick={() => onNavigateTab('groups')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '12px',
                background: '#F4F5F9',
                cursor: 'pointer',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0A0E27', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {grp.group_name}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  {grp.member_count || 1} members
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#2563FF', fontWeight: 700 }}>Join</span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Studio Banner for Super Admin */}
      {isSuperAdmin && (
        <div
          className="card"
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, #0A0E27 0%, #1E40AF 100%)',
            color: '#fff',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(37, 99, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Database size={15} color="#93C5FD" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.6px' }}>
              DATABASE STUDIO
            </span>
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>
            Direct SQL Workbench
          </div>
          <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.8)', marginTop: '4px', lineHeight: '1.4' }}>
            Query SQLite relational tables live with 0ms execution tracking.
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab('sql')}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              marginTop: '12px',
            }}
          >
            <span>Open Studio</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Footer Info */}
      <footer style={{ fontSize: '11.5px', color: '#9CA3AF', lineHeight: '1.6', padding: '0 4px' }}>
        <p>© 2026 Social Sphere. Made for creators.</p>
      </footer>
    </aside>
  );
}

