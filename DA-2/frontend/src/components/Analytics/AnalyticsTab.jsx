import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Activity } from 'lucide-react';
import { api } from '../../api/client';

export default function AnalyticsTab() {
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [overData, evData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsEvents(),
      ]);
      if (overData?.analytics) setOverview(overData.analytics);
      if (evData?.events) setEvents(evData.events);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 60px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-block', background: 'var(--blue-primary)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)', letterSpacing: '0.6px', marginBottom: '4px' }}>
            SUPER ADMIN ACCESS
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Platform Metrics & Telemetry</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Record counters across all 15 relational tables and live audit event logs in Event_Analysis.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Counters Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-stat-card">
              <div className="skeleton skeleton-bar" style={{ width: 80, height: 11 }} />
              <div className="skeleton skeleton-bar" style={{ width: 45, height: 26, marginTop: 4 }} />
            </div>
          ))}
        </div>
      ) : overview ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {Object.entries(overview).map(([key, val]) => (
            <div
              key={key}
              className="aside-card"
              style={{ padding: '14px', background: 'var(--bg-surface)' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {key.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Telemetry Stream */}
      <div className="aside-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--green-accent)" />
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Live Telemetry Audit Trail</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green-accent)', background: 'var(--green-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
            EVENT STREAM
          </span>
        </div>

        <div className="table-scroll">
          <table className="sql-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>User ID</th>
                <th>Type</th>
                <th>Device</th>
                <th>Metadata</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td><div className="skeleton skeleton-bar" style={{ width: 40, height: 12 }} /></td>
                    <td><div className="skeleton skeleton-bar" style={{ width: 60, height: 12 }} /></td>
                    <td><div className="skeleton skeleton-bar" style={{ width: 80, height: 12 }} /></td>
                    <td><div className="skeleton skeleton-bar" style={{ width: 45, height: 12 }} /></td>
                    <td><div className="skeleton skeleton-bar" style={{ width: 140, height: 12 }} /></td>
                    <td><div className="skeleton skeleton-bar" style={{ width: 90, height: 12 }} /></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                    No telemetry events recorded yet. Events will appear in real time as members interact.
                  </td>
                </tr>
              ) : (
                events.slice(0, 50).map((ev) => (
                  <tr key={ev.event_id}>
                    <td>#{ev.event_id}</td>
                    <td>{ev.user_id ? `User #${ev.user_id}` : 'System'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--blue-primary)' }}>
                        {ev.event_type}
                      </span>
                    </td>
                    <td>{ev.device_type || 'WEB'}</td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.metadata || '{}'}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {ev.event_time ? new Date(ev.event_time).toLocaleString() : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
