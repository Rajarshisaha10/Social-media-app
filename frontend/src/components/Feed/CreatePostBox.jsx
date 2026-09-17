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

  const handleInsertTag = (tag) => {
    setContent((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
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
        padding: '20px',
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        boxShadow: '0 4px 20px -4px rgba(10, 14, 39, 0.04)',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div className="story-ring" style={{ padding: '2px', borderRadius: '50%', flexShrink: 0 }}>
          <img
            src={user?.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
            alt={user?.username}
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', background: '#fff' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            rows={3}
            placeholder="What's on your mind? Share moments, code, or ideas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              resize: 'none',
              fontSize: '15px',
              lineHeight: '1.5',
              color: '#0A0E27',
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
                background: '#F4F5F9',
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
                  color: '#0A0E27',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setShowImgInput(false);
                }}
                style={{ color: '#6B7280', padding: '4px', cursor: 'pointer', border: 'none', background: 'none' }}
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
                  background: 'rgba(10, 14, 39, 0.7)',
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

          {/* Quick Actions & Submission Row matching index.html */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                title="Attach Image"
                onClick={() => setShowImgInput(!showImgInput)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: showImgInput ? '#2563FF' : '#4B5563',
                  background: showImgInput ? '#E5EDFF' : 'transparent',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <Smile size={18} />
              </button>

              <button
                type="button"
                title="Add Tech Tag"
                onClick={() => handleInsertTag('#tech')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: '#F4F5F9',
                  color: '#2563FF',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  marginLeft: '4px',
                }}
              >
                #tech
              </button>

              <button
                type="button"
                title="Add Viral Tag"
                onClick={() => handleInsertTag('#vibe')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: '#FFE5EC',
                  color: '#FF2D55',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                #vibe
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isOverLimit ? '#FF2D55' : '#9CA3AF',
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
                  padding: '8px 22px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  opacity: canSubmit ? 1 : 0.45,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

