import React, { useState } from 'react';
import { Sparkles, MapPin, Tag, User, X, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61',
];

const SUGGESTED_INTERESTS = [
  'Databases & SQL',
  'Python',
  'React & Web',
  'Distributed Systems',
  'Machine Learning & AI',
  'Open Source',
  'Cloud Architecture',
  'Photography',
  'DevOps',
];

const QUICK_LOCATIONS = ['San Francisco, CA', 'New York, NY', 'London, UK', 'Zurich, Switzerland', 'Remote'];

export default function ProfileSetupModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();
  const toast = useToast();

  const [bio, setBio] = useState(user?.bio && user.bio !== 'SocialSphere Member' ? user.bio : '');
  const [location, setLocation] = useState(user?.location && user.location !== 'Global' ? user.location : '');
  const [profilePic, setProfilePic] = useState(user?.profile_pic || PRESET_AVATARS[0]);
  
  // Selected interests parsed as array
  const [selectedInterests, setSelectedInterests] = useState(() => {
    if (!user?.interests || user.interests === 'Tech, Coding' || user.interests === 'Technology, Web Development') {
      return ['Databases & SQL', 'React & Web'];
    }
    return user.interests.split(',').map((s) => s.trim()).filter(Boolean);
  });

  const [customInterest, setCustomInterest] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    const trimmed = customInterest.trim().replace(/^#/, '');
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests((prev) => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleSkip = () => {
    if (user?.user_id) {
      localStorage.setItem(`profile_setup_skipped_${user.user_id}`, 'true');
    }
    onClose();
    toast.info('You can update your profile anytime from your profile modal!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const interestsStr = selectedInterests.join(', ');
      await updateUserProfile({
        bio: bio.trim() || 'Software engineer & tech enthusiast',
        location: location.trim() || 'Global',
        interests: interestsStr || 'Technology',
        profilePic,
      });

      if (user?.user_id) {
        localStorage.setItem(`profile_setup_skipped_${user.user_id}`, 'true');
      }

      toast.success('Profile setup complete! Welcome to the Sphere 🎉');
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Could not save profile: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '28px' }}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleSkip}
          aria-label="Close setup modal"
        >
          <X size={18} />
        </button>

        {/* Header with Animation */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--blue-light)',
              color: 'var(--blue-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              animation: 'floatGentle 3s ease-in-out infinite',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Complete Your Profile
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tell members who you are, where you're based, and the tech topics you love.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar Selection */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Choose an Avatar
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {PRESET_AVATARS.map((pic, idx) => {
                const isSelected = profilePic === pic;
                return (
                  <img
                    key={idx}
                    src={pic}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setProfilePic(pic)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: isSelected ? '3px solid var(--blue-primary)' : '2px solid var(--border-default)',
                      boxShadow: isSelected ? '0 0 0 3px var(--blue-light)' : 'none',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Bio Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                About You (Bio)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {bio.length}/160
              </span>
            </div>
            <textarea
              className="auth-input"
              placeholder="e.g. Distributed database architect, open source maintainer & coffee enthusiast..."
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              style={{ height: '74px', resize: 'vertical', fontSize: '13px' }}
            />
          </div>

          {/* Location Input & Quick Chips */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Location
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="auth-input"
                placeholder="City, Country (e.g. San Francisco, CA)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }}
              />
            </div>
            {/* Quick chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: location === loc ? 'var(--blue-light)' : 'var(--bg-surface-secondary)',
                    color: location === loc ? 'var(--blue-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Interests Pill Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select Topics & Interests ({selectedInterests.length} selected)
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto', padding: '2px' }}>
              {SUGGESTED_INTERESTS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? 'var(--blue-primary)' : 'var(--bg-surface-secondary)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      border: isSelected ? '1px solid var(--blue-primary)' : '1px solid var(--border-default)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons: Skip vs Save */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSkip}
              style={{
                flex: 1,
                height: '42px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Skip for now
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{
                flex: 1.5,
                height: '42px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
              {!saving && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
