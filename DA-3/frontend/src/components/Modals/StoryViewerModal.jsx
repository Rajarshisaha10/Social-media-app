import React, { useEffect, useState } from 'react';
import { X, Sparkles, Terminal } from 'lucide-react';

export default function StoryViewerModal({ storyUser, onClose }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!storyUser || paused) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6500);
    return () => clearTimeout(timer);
  }, [storyUser, paused, onClose]);

  if (!storyUser) return null;

  const username = storyUser.username || storyUser.Username || 'Engineer';
  const profilePic = storyUser.profile_pic || storyUser.ProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde';
  const snippet = storyUser.story_snippet || storyUser.bio || storyUser.Bio || 'Shipping high-performance systems and exploring graph database architecture! 🚀';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        style={{
          width: '100%',
          maxWidth: '420px',
          height: 'min(660px, 90dvh)',
          maxHeight: '660px',
          padding: 0,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #090d16 0%, #111827 50%, #030712 100%)',
          position: 'relative',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: '12px', left: '14px', right: '14px', height: '3.5px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', zIndex: 20, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
              animation: paused ? 'none' : 'storyProgress 6.5s linear forwards',
            }}
          />
        </div>

        {/* Top Header */}
        <div style={{ position: 'relative', padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={profilePic}
              alt={username}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px' }}>
                {username}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="#38bdf8" />
                <span>Live Status</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.08)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Close story"
            aria-label="Close story"
          >
            <X size={18} />
          </button>
        </div>

        {/* Story Body Graphic Card */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', position: 'relative' }}>
          {/* Subtle background glow */}
          <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ width: '76px', height: '76px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Terminal size={36} color="#38bdf8" />
          </div>

          <div style={{ maxWidth: '320px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '20px', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
            <p style={{ color: '#f8fafc', fontSize: '15px', fontWeight: 600, lineHeight: '1.6', margin: 0 }}>
              "{snippet}"
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ padding: '16px 20px 24px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
          Hold mouse to pause • Tap anywhere outside to close
        </div>
      </div>
    </div>
  );
}
