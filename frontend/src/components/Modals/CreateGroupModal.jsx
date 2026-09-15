import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user?.user_id) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await api.createGroup({
        name: name.trim(),
        description: description.trim(),
        privacy,
        creatorId: user.user_id,
      });
      setName('');
      setDescription('');
      onGroupCreated?.(res.group || res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--blue-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Create New Community</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: 'var(--red-light)', color: 'var(--red-accent)', fontSize: '12.5px', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Community Name *
            </label>
            <input
              type="text"
              className="auth-input"
              placeholder="e.g. Distributed Database Systems"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Description
            </label>
            <textarea
              className="auth-input"
              placeholder="Describe goals, discussion topics, and ground rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ height: '80px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Privacy Setting
            </label>
            <select
              className="auth-input"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
            >
              <option value="PUBLIC">PUBLIC — Open access for all members</option>
              <option value="PRIVATE">PRIVATE — Invitation and approval only</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !name.trim()}
            style={{ width: '100%', height: '40px', marginTop: '6px' }}
          >
            {submitting ? 'Creating...' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
