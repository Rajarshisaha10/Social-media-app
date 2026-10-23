import React, { useState, useEffect } from 'react';
import { Users, Lock, Globe, Plus, Check, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SPONSORED_ADS = [
  {
    id: 'ad-neo4j',
    sponsor: 'Neo4j AuraDB',
    badge: 'Sponsored Partner',
    title: 'Fully-Managed Cloud Graph Database',
    description: 'Build real-time recommendation engines, fraud rings & knowledge graphs in minutes. Connect your app with zero local setup.',
    cta: 'Start Free Forever',
    url: 'https://neo4j.com/cloud/aura/',
    tag: 'Graph Database',
    accentColor: 'var(--blue-primary)',
    bgCard: 'rgba(59, 130, 246, 0.05)',
    borderCard: '1px solid rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'ad-datadog',
    sponsor: 'Datadog APM',
    badge: 'Featured Offer',
    title: 'End-to-End Cloud Observability',
    description: 'Monitor P99 latency spikes, trace microservices, and map Kubernetes network topology automatically with eBPF.',
    cta: 'Start Free Trial',
    url: 'https://www.datadoghq.com',
    tag: 'Observability & SRE',
    accentColor: '#8b5cf6',
    bgCard: 'rgba(139, 92, 246, 0.05)',
    borderCard: '1px solid rgba(139, 92, 246, 0.25)',
  },
  {
    id: 'ad-vercel',
    sponsor: 'Vercel Enterprise',
    badge: 'Developer Cloud',
    title: 'The Frontend Cloud for Fast Teams',
    description: 'Instant preview deployments, Edge Middleware, and automated React 19 performance optimizations with zero config.',
    cta: 'Explore Platform',
    url: 'https://vercel.com',
    tag: 'Frontend Platform',
    accentColor: '#10b981',
    bgCard: 'rgba(16, 185, 129, 0.05)',
    borderCard: '1px solid rgba(16, 185, 129, 0.25)',
  }
];

export default function CommunitiesTab({ onOpenCreateGroup, refreshKey }) {
  const { user } = useAuth();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      setLoading(true);
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
  }, [user?.user_id, refreshKey]);

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
    toast.success(isMember ? `Left ${group.group_name}` : `Joined ${group.group_name}! 🎉`);

    try {
      await api.toggleJoinGroup(group.group_id, user.user_id);
    } catch (err) {
      console.error('Failed to toggle group join:', err);
      toast.error('Could not update membership');
      // Rollback
      setGroups((prev) =>
        prev.map((g) => (g.group_id === group.group_id ? group : g))
      );
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 20px 60px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
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

      {/* Sponsored Partner Spotlight Ads */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Sparkles size={16} color="var(--gold-accent)" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Sponsored Tech Spotlights
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {SPONSORED_ADS.map((ad) => (
            <div
              key={ad.id}
              className="card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                background: ad.bgCard,
                border: ad.borderCard,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.15)',
                      color: ad.accentColor,
                      letterSpacing: '0.4px',
                    }}
                  >
                    {ad.badge}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {ad.tag}
                  </span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px', color: 'var(--ink)' }}>
                  {ad.sponsor}: {ad.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  {ad.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Ad by {ad.sponsor}
                </span>
                <a
                  href={ad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: ad.accentColor,
                    textDecoration: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span>{ad.cta}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aside-card" style={{ gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton skeleton-bar" style={{ width: 70, height: 12 }} />
                <div className="skeleton skeleton-bar" style={{ width: 60, height: 12 }} />
              </div>
              <div className="skeleton skeleton-bar" style={{ width: '70%', height: 16, marginTop: 4 }} />
              <div className="skeleton skeleton-bar" style={{ width: '90%', height: 13 }} />
              <div className="skeleton skeleton-bar" style={{ width: '60%', height: 13 }} />
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton skeleton-bar" style={{ width: 80, height: 11 }} />
                <div className="skeleton" style={{ width: 70, height: 28, borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="aside-card" style={{ textAlign: 'center', padding: '48px 24px', alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800 }}>No communities found yet</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '360px', marginTop: '6px', lineHeight: '1.5' }}>
            Create the first community channel to bring members together around shared topics, tools, or tech.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenCreateGroup}
            style={{ marginTop: '16px' }}
          >
            <Plus size={16} />
            <span>Create Community</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {groups.map((group) => {
            const isMember = Boolean(group.is_member);
            const privacyVal = (group.privacy_setting || group.privacy || 'PUBLIC').toUpperCase();
            const isPrivate = privacyVal === 'PRIVATE';
            return (
              <div
                key={group.group_id}
                className="aside-card"
                style={{ justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPrivate ? <Lock size={14} color="var(--gold-accent)" /> : <Globe size={14} color="var(--blue-primary)" />}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {privacyVal}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="avatar-stack" title={`${group.member_count || 1} members`}>
                        <img className="avatar-stack-item" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop" alt="Member" />
                        <img className="avatar-stack-item" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop" alt="Member" />
                        <div className="avatar-stack-overflow">+{group.member_count || 1}</div>
                      </div>
                    </div>
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
                    aria-label={isMember ? `Leave ${group.group_name}` : `Join ${group.group_name}`}
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
