import React, { useState, useEffect } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsModal({ isOpen, onClose }) {
  const { user, checkNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.user_id || !isOpen) return;
      try {
        const data = await api.getNotifications(user.user_id);
        if (data?.notifications) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.user_id, isOpen]);

  if (!isOpen) return null;

  const handleDismiss = async (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.notification_id !== notifId));
    try {
      await api.dismissNotification(notifId);
      checkNotifications();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--blue-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Notifications</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close notifications">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', padding: '6px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-notif-row">
                  <div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton skeleton-bar" style={{ width: '85%', height: 12 }} />
                    <div className="skeleton skeleton-bar" style={{ width: '45%', height: 10 }} />
                  </div>
                  <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--blue-light)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Bell size={20} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No unread notifications right now</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.45' }}>
                When members like your posts, comment on your updates, or connect with you, you'll see alerts here.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ marginTop: '12px', fontSize: '12.5px', padding: '6px 16px' }}
              >
                Back to Feed
              </button>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.notification_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: notif.is_read ? 'var(--bg-surface)' : 'var(--blue-light)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                  <p>{notif.content || notif.message}</p>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismiss(notif.notification_id)}
                  title="Mark read"
                  aria-label="Mark notification as read"
                  style={{
                    color: 'var(--text-muted)',
                    padding: '6px',
                    marginLeft: '8px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
