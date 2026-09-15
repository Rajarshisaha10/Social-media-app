import React, { useState, useEffect } from 'react';
import { Users, Lock, Globe, Plus, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CommunitiesTab({ onOpenCreateGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups(user?.user_id);
      if (data?.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user?.user_id]);

  // 0ms Optimistic Join / Leave Toggle
  const handleToggleJoin = async (group) => {
    if (!user?.user_id) return;
    const isMember = Boolean(group.is_member);

    // Optimistic toggle
    setGroups((prev) =>
      prev.map((g) => {
        if (g.group_id === group.group_id) {
          return {
            ...g,
            is_member: !isMember,
            member_count: isMember ? Math.max(1, g.member_count - 1) : g.member_count + 1,
          };
        }
        return g;
      })
    );

    try {
      await api.toggleJoinGroup(group.group_id, user.user_id);
    } catch (err) {
      console.error('Failed to toggle group join:', err);
      // Rollback
      setGroups((prev) =>
        prev.map((g) => (g.group_id === group.group_id ? group : g))
      );
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 20px 60px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Community Channels</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Discover tech collectives, interest groups, and specialized developer discussions.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenCreateGroup}
        >
          <Plus size={16} />
          <span>New Community</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="aside-card" style={{ textAlign: 'center', padding: '40px' }}>
          <Users size={36} style={{ margin: '0 auto 12px', color: 'var(--blue-primary)' }} />
          <h3>No communities created yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Create the first community to start collaborating with members.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {groups.map((group) => {
            const isMember = Boolean(group.is_member);
            const isPrivate = group.privacy === 'PRIVATE';
            return (
              <div
                key={group.group_id}
                className="aside-card animate-fade-in"
                style={{ justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPrivate ? <Lock size={14} color="var(--gold-accent)" /> : <Globe size={14} color="var(--blue-primary)" />}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {group.privacy || 'PUBLIC'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {group.member_count || 1} members
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                    {group.group_name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {group.description || 'A community for developers and enthusiasts.'}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Created by {group.creator_name || 'Admin'}
                  </span>
                  <button
                    type="button"
                    className={`btn-secondary ${isMember ? 'active' : ''}`}
                    onClick={() => handleToggleJoin(group)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 14px',
                      background: isMember ? 'var(--green-light)' : 'var(--blue-light)',
                      color: isMember ? 'var(--green-accent)' : 'var(--blue-primary)',
                      border: 'none',
                    }}
                  >
                    {isMember && <Check size={14} />}
                    <span>{isMember ? 'Joined' : 'Join'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
