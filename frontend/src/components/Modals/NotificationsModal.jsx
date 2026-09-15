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
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--blue-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Notifications</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', padding: '6px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton" style={{ height: '54px', borderRadius: 'var(--radius-sm)' }} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '13px' }}>You're all caught up! No unread notifications.</p>
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
                  style={{ color: 'var(--text-muted)', padding: '4px', marginLeft: '8px' }}
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
