import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function StoryViewerModal({ storyUser, onClose }) {
  useEffect(() => {
    if (!storyUser) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [storyUser, onClose]);

  if (!storyUser) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px', height: '620px', padding: 0, overflow: 'hidden', background: '#000', position: 'relative' }}
      >
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', zIndex: 10, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: '#fff',
              animation: 'storyProgress 5s linear forwards',
            }}
          />
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', top: '20px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={storyUser.profile_pic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
              alt={storyUser.username}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff' }}
            />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {storyUser.username}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#fff', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Media */}
        <img
          src={storyUser.profile_pic || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'}
          alt="Story"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        <div style={{ position: 'absolute', bottom: '20px', left: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 500 }}>
            Excited to explore high-speed social media workflows on SocialSphere! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
