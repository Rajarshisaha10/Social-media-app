import React, { useState } from 'react';
import { Image, Smile, MapPin, AtSign, X, Sparkles, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EMOJI_POOL = ['✨', '🚀', '💖', '🔥', '🎨', '📸', '💫', '🎉', '🌈', '💪', '👀', '💯'];

export default function CreatePostBox({ onPostCreated, onPostSuccess }) {
  const { user, isSuperAdmin } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImgInput, setShowImgInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > 280;
  const canSubmit = (content.trim().length > 0 || imageUrl.trim().length > 0) && !isOverLimit && !submitting;

  const handleInsertEmoji = () => {
    const randomEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
    setContent((prev) => prev + randomEmoji);
  };


  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onPostCreated({
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
      });
      setContent('');
      setImageUrl('');
      setShowImgInput(false);
      if (onPostSuccess) onPostSuccess();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: 'clamp(14px, 3vw, 20px)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div className="story-ring" style={{ padding: '2px', borderRadius: '50%', flexShrink: 0 }}>
          <img
            src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={user?.username}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            rows={3}
            placeholder="What's on your mind? Share a quiet thought, note, or reference..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            style={{
              width: '100%',
              border: 'none',
              resize: 'none',
              fontSize: '15px',
              lineHeight: '1.5',
              color: 'var(--ink)',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />

          {/* Optional Image URL Input Field */}
          {showImgInput && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line)',
              }}
            >
              <input
                type="url"
                placeholder="Paste image link (Unsplash, imgur, etc.)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setShowImgInput(false);
                }}
                style={{ color: 'var(--ink-mute)', padding: '4px', cursor: 'pointer', border: 'none', background: 'none' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Attached Image Preview */}
          {imageUrl && (
            <div style={{ position: 'relative', marginTop: '12px', borderRadius: '16px', overflow: 'hidden' }}>
              <img
                src={imageUrl}
                alt="Post preview"
                style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '16px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(42, 31, 24, 0.7)',
                  color: '#fff',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Quick Actions & Submission Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '8px',
              width: '100%',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                title="Attach Image"
                onClick={() => setShowImgInput(!showImgInput)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: showImgInput ? 'var(--clay-deep)' : 'var(--ink-soft)',
                  background: showImgInput ? 'var(--blue-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <Image size={18} />
              </button>

              <button
                type="button"
                title="Add Emoji"
                onClick={handleInsertEmoji}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-soft)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <Smile size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isOverLimit ? 'var(--clay)' : 'var(--ink-mute)',
                }}
              >
                {charCount}/280
              </span>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="btn-primary"
                style={{
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  opacity: canSubmit ? 1 : 0.45,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {submitting ? 'Sharing...' : 'Share note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

