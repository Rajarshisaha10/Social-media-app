import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImageLightboxModal({ imageUrl, caption, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close-btn" onClick={onClose} aria-label="Close image preview">
          <X size={20} />
        </button>
        <img src={imageUrl} alt={caption || 'Preview image'} className="lightbox-image" />
        {caption && <div className="lightbox-caption">{caption}</div>}
      </div>
    </div>
  );
}
