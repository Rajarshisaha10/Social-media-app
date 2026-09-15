import React, { useState } from 'react';
import { Image, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostBox({ onPostCreated }) {
  const { user, isSuperAdmin } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImgInput, setShowImgInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) return;

    setSubmitting(true);
    try {
      await onPostCreated({
        content: content.trim(),
        imageUrl: imageUrl.trim(),
      });
      setContent('');
      setImageUrl('');
      setShowImgInput(false);
    } catch (err) {
      console.error('Failed to publish post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-top">
        <img
          className="create-avatar"
          src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
          alt={user?.username}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="create-author">{user?.username}</span>
          {isSuperAdmin && <span className="admin-pill-tag">SUPER ADMIN</span>}
        </div>
      </div>

      <textarea
        className="create-input-box"
        placeholder="What's happening? Use #tech, #database, #coding..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {showImgInput && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="url"
            className="image-input-field"
            placeholder="Paste image URL (Unsplash, imgur, etc.)..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => { setImageUrl(''); setShowImgInput(false); }}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {imageUrl && (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '200px' }}>
          <img
            src={imageUrl}
            alt="Preview"
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => setImageUrl('')}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="create-post-bottom">
        <button
          type="button"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          onClick={() => setShowImgInput(!showImgInput)}
        >
          <Image size={16} />
          <span>{showImgInput ? 'Hide Image Field' : 'Attach Image'}</span>
        </button>

        <button
          type="button"
          className="btn-primary"
          disabled={submitting || (!content.trim() && !imageUrl.trim())}
          onClick={handleSubmit}
        >
          <Send size={15} />
          <span>{submitting ? 'Sharing...' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
