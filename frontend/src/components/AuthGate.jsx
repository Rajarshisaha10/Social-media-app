import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Sparkles, User, Lock, ArrowRight, X, Play, Heart, MessageSquare,
  Zap, Star, Wand2, Shield, Users, Coins, Share2, Check, ExternalLink
} from 'lucide-react';
import NexoMascot from './NexoMascot';

export default function AuthGate() {
  const { login, register } = useAuth();
  const toast = useToast();

  // Auth modal: null | 'login' | 'register'
  const [authModal, setAuthModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs (strictly username, name, password)
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Interactive live preview likes state
  const [previewLikes1, setPreviewLikes1] = useState(12400);
  const [hasLiked1, setHasLiked1] = useState(false);
  const [previewLikes2, setPreviewLikes2] = useState(8200);
  const [hasLiked2, setHasLiked2] = useState(true);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(loginUsername.trim(), loginPassword.trim());
      toast.success('Welcome back to Social Sphere! ✨');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim()) return;
    setLoading(true);
    setError('');

    const emailToUse = `${regUsername.trim().toLowerCase()}@socialsphere.app`;

    try {
      await register({
        username: regUsername.trim(),
        email: emailToUse,
        password: regPassword.trim(),
        bio: regName.trim() ? `${regName.trim()} · Social Sphere Creator` : 'Social Sphere Creator',
        location: 'Global',
        interests: 'Technology, Art, Creation',
      });
      toast.success('Welcome to Social Sphere! 🎉');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (tab) => {
    setError('');
    setAuthModal(tab);
  };

  const closeAuth = () => {
    setAuthModal(null);
    setError('');
  };

  const handleMascotWave = () => {
    toast.info('Nexo waves at you! 👋 Keep creating magic.');
  };

  return (
    <div className="landing-page" style={{ background: '#FFFFFF', color: 'var(--text)' }}>
      {/* ============================================================ */}
      {/* NAVBAR */}
      {/* ============================================================ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="#"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: '32px', color: '#0A0E27', letterSpacing: '0.5px' }}>
              Social Sphere
            </span>
          </a>

          <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#features" className="link-underline" style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#preview" className="link-underline" style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563', textDecoration: 'none' }}>
              Live preview
            </a>
            <a href="#mascot" className="link-underline" style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563', textDecoration: 'none' }}>
              Meet Nexo
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => openAuth('login')}
              style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', padding: '8px 16px' }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="btn-primary"
              style={{ padding: '10px 22px', borderRadius: '9999px', fontSize: '13.5px', fontWeight: 700, color: '#fff' }}
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="grid-bg" style={{ position: 'relative', paddingTop: '120px', paddingBottom: '80px', overflow: 'hidden' }}>
        {/* Floating gradient ambient blobs */}
        <div className="blob" style={{ width: '520px', height: '520px', top: '-140px', left: '-120px', background: '#FF2D55' }} />
        <div className="blob" style={{ width: '480px', height: '480px', top: '160px', right: '-80px', background: '#2563FF', animationDelay: '-5s' }} />

        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            {/* Live creators pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                border: '1px solid var(--border-strong)',
                background: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(10, 14, 39, 0.04)',
                marginBottom: '28px',
              }}
            >
              <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#374151' }}>
                2.4M creators online right now
              </span>
            </div>

            {/* Giant display headline */}
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(44px, 6vw, 76px)',
                fontWeight: 800,
                lineHeight: 0.94,
                marginBottom: '24px',
                letterSpacing: '-0.03em',
              }}
            >
              Where the<br />
              <span className="gradient-text">internet</span><br />
              comes alive.
            </h1>

            <p style={{ fontSize: '18px', color: '#4B5563', maxWidth: '540px', marginBottom: '32px', lineHeight: 1.6 }}>
              Social Sphere is the social playground for creators. Share moments, build tribes, and turn your voice into a movement.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => openAuth('register')}
                style={{
                  padding: '14px 32px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Start creating</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="#preview"
                style={{
                  padding: '14px 28px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1px solid var(--border-strong)',
                  background: '#FFFFFF',
                  color: '#1F2937',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Play size={14} fill="#FF2D55" color="#FF2D55" />
                <span>See it in action</span>
              </a>
            </div>

            {/* Avatar social proof cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', marginLeft: '6px' }}>
                {['u1', 'u2', 'u3', 'u4'].map((seed, i) => (
                  <img
                    key={seed}
                    src={`https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1507003211169-0a1dd7228f2d', '1534528741775-53994a69daeb'][i]}?w=80&h=80&fit=crop`}
                    alt="User"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: '2px solid #FFFFFF',
                      marginLeft: '-10px',
                      objectFit: 'cover',
                    }}
                  />
                ))}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                    marginLeft: '-10px',
                    background: 'linear-gradient(135deg, #FF2D55 0%, #2563FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  ✦
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="#F59E0B" />
                  ))}
                  <span style={{ color: '#111827', fontWeight: 800, fontSize: '13px', marginLeft: '4px' }}>4.9</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#6B7280' }}>Loved by creators worldwide</div>
              </div>
            </div>
          </div>

          {/* Mascot column with floating stat cards */}
          <div style={{ position: 'relative', height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              className="card float-anim"
              style={{
                position: 'absolute',
                top: '40px',
                left: '20px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 12px 30px -8px rgba(10, 14, 39, 0.12)',
                zIndex: 4,
              }}
            >
              <Heart size={16} fill="#FF2D55" color="#FF2D55" />
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Real-time Likes</span>
            </div>

            <div
              className="card float-anim"
              style={{
                position: 'absolute',
                bottom: '60px',
                right: '10px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 12px 30px -8px rgba(10, 14, 39, 0.12)',
                animationDelay: '-4s',
                zIndex: 4,
              }}
            >
              <MessageSquare size={16} fill="#2563FF" color="#2563FF" />
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Live Comments</span>
            </div>

            <div
              className="card float-anim"
              style={{
                position: 'absolute',
                top: '120px',
                right: '20px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 12px 30px -8px rgba(10, 14, 39, 0.12)',
                animationDelay: '-2s',
                zIndex: 4,
              }}
            >
              <Zap size={16} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Instant Updates</span>
            </div>

            {/* Mascot Nexo */}
            <div style={{ width: '310px', height: '310px', position: 'relative', zIndex: 3 }}>
              <NexoMascot onReact={handleMascotWave} />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MARQUEE STRIP */}
      {/* ============================================================ */}
      <section
        style={{
          padding: '20px 0',
          background: '#0A0E27',
          overflow: 'hidden',
          display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="marquee" style={{ display: 'flex', gap: '48px', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, idx) => (
            <React.Fragment key={idx}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                CREATE
              </span>
              <span style={{ color: '#FF2D55', fontSize: '20px' }}>✦</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                SHARE
              </span>
              <span style={{ color: '#FFD93D', fontSize: '20px' }}>✦</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                CONNECT
              </span>
              <span style={{ color: '#2563FF', fontSize: '20px' }}>✦</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                VIBE
              </span>
              <span style={{ color: '#FF2D55', fontSize: '20px' }}>✦</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES BENTO GRID */}
      {/* ============================================================ */}
      <section id="features" style={{ padding: '96px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '60px', maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#FFE5EC',
              color: '#FF2D55',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            FEATURES
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 0.98, marginBottom: '14px' }}
          >
            Everything you need to <span className="gradient-text">go viral</span>
          </h2>
          <p style={{ fontSize: '18px', color: '#4B5563' }}>
            Tools that make creating dangerously addictive. In a good way.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1: AI-powered */}
          <div
            className="card card-hover"
            style={{
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              gridColumn: 'span 2',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FF2D55 0%, #2563FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '18px',
                boxShadow: '0 8px 20px -4px rgba(255, 45, 85, 0.4)',
              }}
            >
              <Wand2 size={24} />
            </div>
            <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>
              AI-powered creation
            </h3>
            <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: 1.6, marginBottom: '24px', maxWidth: '520px' }}>
              Generate captions, suggest hashtags, edit media, and remix trends — all with one effortless tap.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop"
                alt="AI preview"
                style={{ width: '100%', height: '110px', borderRadius: '14px', objectFit: 'cover' }}
              />
              <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop"
                alt="AI preview"
                style={{ width: '100%', height: '110px', borderRadius: '14px', objectFit: 'cover' }}
              />
              <img
                src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=300&h=200&fit=crop"
                alt="AI preview"
                style={{ width: '100%', height: '110px', borderRadius: '14px', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Card 2: Real-time engagement */}
          <div className="card card-hover" style={{ padding: '32px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563FF 0%, #1E40AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '18px',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 255, 0.4)',
              }}
            >
              <Zap size={24} />
            </div>
            <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              Real-time engagement
            </h3>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.55 }}>
              See likes, comments, and shares as they happen. Instant reactivity powered by our high-speed SQL pipeline.
            </p>
          </div>

          {/* Card 3: Creator-first */}
          <div className="card card-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #FFD93D 0%, #FF2D55 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '14px',
              }}
            >
              <Shield size={22} />
            </div>
            <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              Creator-first
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563' }}>You own your content and graph. Always.</p>
          </div>

          {/* Card 4: Real-time reactions */}
          <div className="card card-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF2D55 0%, #E11D48 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <div className="font-display gradient-text" style={{ fontSize: '32px', fontWeight: 800 }}>
                Real-Time
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>instant live reactions</div>
            </div>
          </div>

          {/* Card 5: Build your tribe */}
          <div className="card card-hover" style={{ padding: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563FF 0%, #1E40AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                marginBottom: '14px',
              }}
            >
              <Users size={22} />
            </div>
            <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              Build your tribe
            </h3>
            <p style={{ fontSize: '13px', color: '#4B5563' }}>Create public or private community spaces for your fans.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LIVE FEED PREVIEW */}
      {/* ============================================================ */}
      <section id="preview" style={{ padding: '96px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: '#E5EDFF',
                color: '#2563FF',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                marginBottom: '14px',
              }}
            >
              LIVE PREVIEW
            </div>
            <h2 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 0.95, marginBottom: '14px' }}>
              A feed that <span className="gradient-text">feels alive</span>
            </h2>
            <p style={{ fontSize: '18px', color: '#4B5563', maxWidth: '640px', margin: '0 auto' }}>
              This is what your home screen looks like inside. Responsive, vibrant, and packed with micro-interactions.
            </p>
          </div>

          <div
            className="card"
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              overflow: 'hidden',
              boxShadow: '0 24px 60px -20px rgba(10, 14, 39, 0.15)',
            }}
          >
            {/* Feed bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF2D55, #2563FF)',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Your feed</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Home · Live</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                <button style={{ fontWeight: 700, color: '#2563FF', borderBottom: '2px solid #2563FF', paddingBottom: '4px' }}>
                  For you
                </button>
                <button style={{ fontWeight: 600, color: '#6B7280', paddingBottom: '4px' }}>
                  Following
                </button>
              </div>
            </div>

            {/* Post 1 */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                  alt="Maya"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Maya Chen</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>@mayacreates · 2m</span>
                  </div>
                  <p style={{ fontSize: '14px', marginTop: '4px' }}>
                    just dropped my new generative art series ✨ hours of work, worth every minute.
                  </p>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop"
                alt="Post media"
                style={{ width: '100%', height: '240px', borderRadius: '16px', objectFit: 'cover', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#6B7280' }}>
                <button
                  type="button"
                  onClick={() => {
                    setHasLiked1(!hasLiked1);
                    setPreviewLikes1(hasLiked1 ? previewLikes1 - 1 : previewLikes1 + 1);
                  }}
                  className={`reaction-btn ${hasLiked1 ? 'reacted-like' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Heart size={16} fill={hasLiked1 ? '#FF2D55' : 'none'} color={hasLiked1 ? '#FF2D55' : '#6B7280'} />
                  <span>{previewLikes1.toLocaleString()}</span>
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} /> 892
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={16} /> 234
                </span>
              </div>
            </div>

            {/* Post 2 */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                  alt="Jay"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Jay Patel</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>@jay.codes · 14m</span>
                  </div>
                  <p style={{ fontSize: '14px', marginTop: '4px' }}>
                    shipped our real-time relational engine today. 1000 stars on GitHub in 6 hours! 🚀
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#6B7280' }}>
                <button
                  type="button"
                  onClick={() => {
                    setHasLiked2(!hasLiked2);
                    setPreviewLikes2(hasLiked2 ? previewLikes2 - 1 : previewLikes2 + 1);
                  }}
                  className={`reaction-btn ${hasLiked2 ? 'reacted-like' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Heart size={16} fill={hasLiked2 ? '#FF2D55' : 'none'} color={hasLiked2 ? '#FF2D55' : '#6B7280'} />
                  <span>{previewLikes2.toLocaleString()}</span>
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} /> 241
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={16} /> 512
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => openAuth('login')}
              style={{ padding: '14px 34px', borderRadius: '9999px', fontWeight: 700, fontSize: '15px', color: '#fff' }}
            >
              <span>Try it yourself</span>
              <ArrowRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS COUNTERS */}
      {/* ============================================================ */}
      <section style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
          <div>
            <div className="font-display gradient-text" style={{ fontSize: '56px', fontWeight: 800 }}>2.4M+</div>
            <div style={{ color: '#6B7280', fontSize: '15px', fontWeight: 600 }}>Active creators</div>
          </div>
          <div>
            <div className="font-display gradient-text" style={{ fontSize: '56px', fontWeight: 800 }}>847M</div>
            <div style={{ color: '#6B7280', fontSize: '15px', fontWeight: 600 }}>Posts daily</div>
          </div>
          <div>
            <div className="font-display gradient-text" style={{ fontSize: '56px', fontWeight: 800 }}>98%</div>
            <div style={{ color: '#6B7280', fontSize: '15px', fontWeight: 600 }}>Creator satisfaction</div>
          </div>
          <div>
            <div className="font-display gradient-text" style={{ fontSize: '56px', fontWeight: 800 }}>156+</div>
            <div style={{ color: '#6B7280', fontSize: '15px', fontWeight: 600 }}>Countries</div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MEET NEXO MASCOT INTRO */}
      {/* ============================================================ */}
      <section id="mascot" style={{ padding: '96px 24px', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#FFE5EC',
              color: '#FF2D55',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              marginBottom: '14px',
            }}
          >
            MEET NEXO
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 0.96, marginBottom: '20px' }}
          >
            Your creative <span className="gradient-text">sidekick</span><br />
            lives in the dashboard.
          </h2>
          <p style={{ fontSize: '18px', color: '#4B5563', lineHeight: 1.6, marginBottom: '48px' }}>
            Nexo drops tips, celebrates your wins, and keeps your feed feeling fresh. Think of him as your creative co-pilot.
          </p>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ width: '280px', height: '280px', margin: '0 auto' }}>
              <NexoMascot onReact={handleMascotWave} />
            </div>

            <div
              className="tip-bubble"
              style={{
                position: 'absolute',
                top: '-10px',
                left: '-80px',
                textAlign: 'left',
                maxWidth: '220px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Nexo says:</div>
              <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Post at 7pm for max reach! 🚀</div>
            </div>

            <div
              className="tip-bubble"
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '-80px',
                textAlign: 'left',
                maxWidth: '220px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Pro tip:</div>
              <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Add 3+ images for 2x engagement ✨</div>
            </div>
          </div>

          <div style={{ marginTop: '48px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => openAuth('register')}
              style={{ padding: '14px 34px', borderRadius: '9999px', fontWeight: 700, fontSize: '15px', color: '#fff' }}
            >
              <span>Meet Nexo in your dashboard</span>
              <ArrowRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </section>



      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer style={{ padding: '64px 24px 40px', borderTop: '1px solid var(--border)', background: '#FAFAFC' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: '26px', color: '#0A0E27' }}>Social Sphere</span>
            <span style={{ color: '#6B7280', fontSize: '13px' }}>— Where the internet comes alive.</span>
          </div>

          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            © 2026 Social Sphere · High-Performance Social & SQL Studio
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* AUTH MODAL (Strictly Username, Name, Password) */}
      {/* ============================================================ */}
      {authModal && (
        <div className="modal-overlay" onClick={closeAuth}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '36px',
              borderRadius: '32px',
              boxShadow: '0 25px 60px -15px rgba(10, 14, 39, 0.2)',
              position: 'relative',
              animation: 'scaleInPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            <button
              type="button"
              onClick={closeAuth}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                background: '#F3F4F6',
              }}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '38px',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                Social Sphere
              </div>
              <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
                Welcome to Social Sphere
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                {authModal === 'login' ? 'Sign in to your account' : 'Join the community in seconds'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div
              style={{
                display: 'flex',
                borderRadius: '9999px',
                background: '#F3F4F6',
                padding: '4px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => { setAuthModal('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: authModal === 'login' ? '#FFFFFF' : 'transparent',
                  color: authModal === 'login' ? '#111827' : '#6B7280',
                  boxShadow: authModal === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModal('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: authModal === 'register' ? '#FFFFFF' : 'transparent',
                  color: authModal === 'register' ? '#111827' : '#6B7280',
                  boxShadow: authModal === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  animation: 'fadeSlideUp 0.2s ease-out',
                }}
              >
                {error}
              </div>
            )}

            {authModal === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. rajarshi"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      style={{ paddingLeft: '40px', borderRadius: '14px', height: '44px' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ paddingLeft: '40px', borderRadius: '14px', height: '44px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    color: '#fff',
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Username *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. alex_creates"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      style={{ paddingLeft: '40px', borderRadius: '14px', height: '44px' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Full Name (optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Sparkles size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Alex Rivera"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{ paddingLeft: '40px', borderRadius: '14px', height: '44px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Password (4+ characters) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Create password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{ paddingLeft: '40px', borderRadius: '14px', height: '44px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    color: '#fff',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Creating account...' : 'Start creating'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>

                <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginTop: '2px', lineHeight: 1.4 }}>
                  You'll customize your bio, location & interests right after signing up (or skip anytime).
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
