import React, { useState, useEffect } from 'react';
import { Search, Compass } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function UsersTab({ onUserClick }) {
  const { user, followingSet, toggleFollow } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getUsers(user?.user_id);
        if (data?.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.user_id]);

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q) ||
      u.interests?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 20px 60px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Explore Members</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Browse members across the network, view developer credentials, and follow profiles.
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="auth-input"
            placeholder="Search by name, skill, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', borderRadius: 'var(--radius-full)' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="aside-card" style={{ textAlign: 'center', padding: '40px' }}>
          <Compass size={36} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <h3>No members matched</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Try a different search term or clear the search query.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
          {filteredUsers.map((member) => {
            const isSelf = member.user_id === user?.user_id;
            const isFollowing = followingSet.has(member.user_id);
            return (
              <div
                key={member.user_id}
                className="aside-card animate-fade-in"
                style={{ alignItems: 'center', textAlign: 'center', padding: '20px' }}
              >
                <img
                  src={member.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt={member.username}
                  onClick={() => onUserClick?.(member.user_id)}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
                <div
                  onClick={() => onUserClick?.(member.user_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', cursor: 'pointer' }}
                >
                  <h4 style={{ fontWeight: 800, fontSize: '14.5px' }}>{member.username}</h4>
                  {member.admin_level === 'SUPER_ADMIN' && (
                    <span className="admin-pill-tag">ADMIN</span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '32px', marginTop: '2px' }}>
                  {member.location || member.bio || 'SocialSphere Member'}
                </p>

                {isSelf ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, padding: '5px 0' }}>
                    You
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`btn-follow ${isFollowing ? 'following' : ''}`}
                    onClick={() => toggleFollow(member.user_id)}
                    style={{ width: '100%', marginTop: 'auto' }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
