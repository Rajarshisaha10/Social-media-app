import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  Lock,
  EyeOff,
  Database,
  Zap,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  X,
  Sparkles,
  User,
  MessageSquare,
  Smartphone,
  Terminal,
  Globe,
  Key,
  Check,
  Layers,
  Heart,
  Share2,
  Bookmark,
  ShieldCheck,
  Server,
  FileCode,
  Download
} from 'lucide-react';

const DEMO_PERSONAS = [
  { username: 'aditi', name: 'Aditi Sharma', role: 'Fullstack Dev & Open Source', pass: 'aditi123', color: '#C26B4D', avatar: 'A' },
  { username: 'rajarshi', name: 'Rajarshi Saha', role: 'Platform Architect', pass: 'dbms108', color: '#7A8B6F', avatar: 'R' },
  { username: 'alex', name: 'Alex Morgan', role: 'Photographer & Designer', pass: 'alex123', color: '#D4A574', avatar: 'M' },
  { username: 'priya', name: 'Priya Kapoor', role: 'Curator & Essayist', pass: 'priya123', color: '#6E4A5B', avatar: 'P' },
];

export default function AuthGate() {
  const { login, register } = useAuth();
  const toast = useToast();

  // Navigation scroll state & mobile toggle
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Showcase panel state ('feed' | 'privacy' | 'sql' | 'chat')
  const [activeTab, setActiveTab] = useState('feed');
  const [counterValue, setCounterValue] = useState(0);

  // Auth modal state: null | 'login' | 'register'
  const [authModal, setAuthModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Glider calculation
  const tabsRef = useRef(null);
  const gliderRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate counter from 0 to 2412
  useEffect(() => {
    const target = 2412;
    const duration = 1400;
    const stepTime = 20;
    const steps = duration / stepTime;
    const inc = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += inc;
      if (current >= target) {
        setCounterValue(target);
        clearInterval(timer);
      } else {
        setCounterValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  // Update tab glider position
  useEffect(() => {
    if (!tabsRef.current || !gliderRef.current) return;
    const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      gliderRef.current.style.width = `${activeBtn.offsetWidth}px`;
      gliderRef.current.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
    }
  }, [activeTab]);

  const openAuth = (tab) => {
    setError('');
    setAuthModal(tab);
  };

  const closeAuth = () => {
    setAuthModal(null);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(loginUsername.trim(), loginPassword.trim());
      toast.success('Welcome back to SocialSphere! ✨');
    } catch (err) {
      setError(err.message || 'Login failed. Check your username and password.');
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
        bio: regName.trim() ? `${regName.trim()} · Privacy Advocate` : 'SocialSphere Member',
        location: 'Global',
        interests: 'Privacy, Relational DBs, Design',
      });
      toast.success('Account created! Welcome to SocialSphere 🎉');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaLogin = async (persona) => {
    setLoading(true);
    setError('');
    try {
      await login(persona.username, persona.pass);
      toast.success(`Logged in as @${persona.username} (${persona.name}) ✨`);
    } catch (err) {
      // If persona password differs, open login modal with prefilled username
      setLoginUsername(persona.username);
      setLoginPassword(persona.pass);
      setAuthModal('login');
      setError('Could not auto-login: please verify credentials or sign in manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--ink)' }}>
      {/* Ambient background layers */}
      <div className="ambient" aria-hidden="true">
        <div className="ambient__grain"></div>
        <div className="ambient__blob ambient__blob--1"></div>
        <div className="ambient__blob ambient__blob--2"></div>
        <div className="ambient__blob ambient__blob--3"></div>
        <svg className="leaf leaf--1" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7 6 4 10 4 14a8 8 0 0016 0c0-4-3-8-8-12z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M12 6v14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <svg className="leaf leaf--2" viewBox="0 0 24 24" fill="none">
          <path d="M3 12c4-5 8-8 12-8 4 0 6 3 6 8s-2 8-6 8-8-3-12-8z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <svg className="leaf leaf--3" viewBox="0 0 24 24" fill="none">
          <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 15l6-6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Navigation */}
      <header className={`nav ${isScrolled ? 'is-scrolled' : ''}`} id="nav">
        <div className="nav__inner">
          <a href="#" className="brand" aria-label="SocialSphere Home">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 21c0-5 3-9 8-10-1 6-4 10-8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M12 21c0-5-3-9-8-10 1 6 4 10 8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M12 21V11" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
            <span className="brand__name">SocialSphere</span>
          </a>

          <nav className={`nav__menu ${mobileMenuOpen ? 'is-open' : ''}`} id="navMenu">
            <a href="#privacy" className="nav__link" onClick={() => setMobileMenuOpen(false)}>Privacy Architecture</a>
            <a href="#capabilities" className="nav__link" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
            <a href="#manifesto" className="nav__link" onClick={() => setMobileMenuOpen(false)}>Comparison</a>
            <a href="#tech" className="nav__link" onClick={() => setMobileMenuOpen(false)}>Tech Specs</a>
            <a href="#faq" className="nav__link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <button
              type="button"
              className="nav__link nav__link--muted"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth('login');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm nav__cta"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth('register');
              }}
            >
              Join Free
            </button>
          </nav>

          <button
            className={`nav__toggle ${mobileMenuOpen ? 'is-open' : ''}`}
            id="navToggle"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* ============================================================ */}
        {/* HERO SECTION */}
        {/* ============================================================ */}
        <section className="hero">
          <div className="hero__grid">
            {/* Left: Copy & Actions */}
            <div className="hero__copy">
              <span className="eyebrow reveal is-in">
                <span className="eyebrow__dot"></span>
                Privacy-First Architecture · Zero Surveillance · Open SQL Studio
              </span>

              <h1 className="hero__title">
                <span className="line">A <em>calm,</em> human</span>
                <span className="line">space to connect.</span>
                <span className="line">Engineered for privacy.</span>
              </h1>

              <p className="hero__lede">
                A social platform free from behavioral surveillance, invasive data brokers, and addictive algorithms.
                Experience pure chronological feeds, end-to-end direct messaging, and an open 17-table relational SQL studio — all under your sovereign control.
              </p>

              <div className="hero__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => openAuth('register')}
                >
                  <span>Create Account — Free</span>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => openAuth('login')}
                >
                  <span className="btn__play" aria-hidden="true">
                    <span></span>
                  </span>
                  Explore Live Demo
                </button>
              </div>

              {/* Quick Persona Launchers */}
              <div className="personas-strip">
                <div className="personas-label">
                  <Sparkles size={14} color="var(--clay)" />
                  One-Click Test Personas (No typing required)
                </div>
                <div className="personas-list">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.username}
                      type="button"
                      className="persona-chip"
                      onClick={() => handlePersonaLogin(p)}
                      title={`Instant login as @${p.username}`}
                    >
                      <div className="persona-avatar" style={{ background: p.color, color: '#FFF' }}>
                        {p.avatar}
                      </div>
                      <div className="persona-info">
                        <span className="persona-user">@{p.username}</span>
                        <span className="persona-role">{p.name.split(' ')[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="hero__social">
                <div className="avatars" aria-hidden="true">
                  <span className="avatar" style={{ '--c': '#C26B4D' }}>A</span>
                  <span className="avatar" style={{ '--c': '#7A8B6F' }}>R</span>
                  <span className="avatar" style={{ '--c': '#D4A574' }}>M</span>
                  <span className="avatar avatar--more">+2k</span>
                </div>
                <p className="hero__social-text">
                  Joined by <strong>{counterValue.toLocaleString()}</strong>+ privacy-conscious creators this month
                </p>
              </div>
            </div>

            {/* Right: Interactive Showcase Panel */}
            <div className="hero__stage reveal is-in">
              <div className="card-stack">
                {/* Floating Chips */}
                <div className="chip chip--float" style={{ '--d': '0.2s' }}>
                  <ShieldCheck size={14} color="var(--sage-deep)" />
                  Zero Trackers Active
                </div>
                <div className="chip chip--float chip--float--b" style={{ '--d': '0.5s' }}>
                  <Database size={14} color="var(--clay)" />
                  17 Relational Tables
                </div>

                <article className="panel">
                  <header className="panel__head">
                    <div>
                      <p className="panel__eyebrow">Platform Capabilities</p>
                      <h2 className="panel__title">Live System Preview</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="chip__dot chip__dot--sage" title="Engine Online"></span>
                      <span style={{ fontSize: '11px', color: 'var(--sage-deep)', fontWeight: 600 }}>FASTAPI v2.0</span>
                    </div>
                  </header>

                  {/* Interactive Tabs */}
                  <div className="tabs" role="tablist" ref={tabsRef}>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'feed' ? 'tab--active' : ''}`}
                      role="tab"
                      data-tab="feed"
                      onClick={() => setActiveTab('feed')}
                    >
                      Quiet Feed
                    </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'privacy' ? 'tab--active' : ''}`}
                      role="tab"
                      data-tab="privacy"
                      onClick={() => setActiveTab('privacy')}
                    >
                      Privacy Shield
                    </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'sql' ? 'tab--active' : ''}`}
                      role="tab"
                      data-tab="sql"
                      onClick={() => setActiveTab('sql')}
                    >
                      SQL Studio
                    </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'chat' ? 'tab--active' : ''}`}
                      role="tab"
                      data-tab="chat"
                      onClick={() => setActiveTab('chat')}
                    >
                      Direct Chat
                    </button>
                    <span className="tabs__glider" id="tabGlider" ref={gliderRef}></span>
                  </div>

                  <div className="panel__body" id="panelBody">
                    {/* Feed Tab */}
                    {activeTab === 'feed' && (
                      <div className="tab-panel tab-panel--active">
                        <article className="collection" onClick={() => openAuth('login')}>
                          <div className="collection__cover collection__cover--coastal" aria-hidden="true">
                            <svg viewBox="0 0 80 80" fill="none">
                              <circle cx="58" cy="22" r="6" stroke="currentColor" strokeWidth="1.4" />
                              <path d="M4 56c8-6 16-6 24 0s16 6 24 0 16-6 24 0" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </div>
                          <div className="collection__meta">
                            <h3 className="collection__name">Golden Hour &amp; Reflections</h3>
                            <p className="collection__count">by @alex.morgan · 2h ago</p>
                            <div className="tags">
                              <span className="tag">calm</span>
                              <span className="tag">photography</span>
                              <span className="tag" style={{ background: 'rgba(122, 139, 111, 0.15)', color: 'var(--sage-deep)' }}>ad-free</span>
                            </div>
                          </div>
                        </article>

                        <article className="collection" onClick={() => openAuth('login')}>
                          <div className="collection__cover collection__cover--clay" aria-hidden="true">
                            <svg viewBox="0 0 80 80" fill="none">
                              <path d="M28 22h24l-2 8a10 10 0 01-20 0l-2-8z" stroke="currentColor" strokeWidth="1.4" />
                              <path d="M26 30h28v22a8 8 0 01-8 8H34a8 8 0 01-8-8V30z" stroke="currentColor" strokeWidth="1.4" />
                            </svg>
                          </div>
                          <div className="collection__meta">
                            <h3 className="collection__name">Slow Craft &amp; Identity Notes</h3>
                            <p className="collection__count">by @priya.k · Curated Space</p>
                            <div className="tags">
                              <span className="tag">slow design</span>
                              <span className="tag">curated</span>
                            </div>
                          </div>
                        </article>
                      </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                      <div className="tab-panel tab-panel--active" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(122, 139, 111, 0.12)', border: '1px solid rgba(122, 139, 111, 0.25)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle2 size={18} color="var(--sage-deep)" />
                          <div style={{ fontSize: '13px', lineHeight: 1.3 }}>
                            <strong style={{ color: 'var(--sage-deep)' }}>Zero Third-Party Trackers Detected</strong>
                            <div style={{ color: 'var(--ink-soft)', fontSize: '11.5px' }}>No Google Analytics, Meta Pixel, or telemetry cookies.</div>
                          </div>
                        </div>

                        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(194, 107, 77, 0.1)', border: '1px solid var(--line-clay)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Lock size={18} color="var(--clay-deep)" />
                          <div style={{ fontSize: '13px', lineHeight: 1.3 }}>
                            <strong style={{ color: 'var(--clay-deep)' }}>Argon2 &amp; Bcrypt Hashing</strong>
                            <div style={{ color: 'var(--ink-soft)', fontSize: '11.5px' }}>Industry standard salted password protection &amp; token sessions.</div>
                          </div>
                        </div>

                        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Download size={18} color="var(--ink)" />
                          <div style={{ fontSize: '13px', lineHeight: 1.3 }}>
                            <strong>Full Data Export &amp; Wipe Rights</strong>
                            <div style={{ color: 'var(--ink-soft)', fontSize: '11.5px' }}>Instant one-click SQL/JSON data download and complete deletion.</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SQL Studio Tab */}
                    {activeTab === 'sql' && (
                      <div className="tab-panel tab-panel--active">
                        <div className="tech-terminal" style={{ padding: '16px', fontSize: '12px' }}>
                          <div className="terminal-dots">
                            <div className="terminal-dot terminal-dot--red"></div>
                            <div className="terminal-dot terminal-dot--yellow"></div>
                            <div className="terminal-dot terminal-dot--green"></div>
                            <span style={{ fontSize: '11px', color: '#7F848E', marginLeft: 'auto' }}>MySQL / SQLite · 17 Tables</span>
                          </div>
                          <div><span className="sql-comment">-- Transparent User Privacy Scoping</span></div>
                          <div>
                            <span className="sql-keyword">SELECT</span> u.username, u.privacy_tier, <span className="sql-keyword">COUNT</span>(p.id) <span className="sql-keyword">AS</span> posts
                          </div>
                          <div>
                            <span className="sql-keyword">FROM</span> <span className="sql-table">users</span> u
                          </div>
                          <div>
                            <span className="sql-keyword">LEFT JOIN</span> <span className="sql-table">posts</span> p <span className="sql-keyword">ON</span> u.id = p.author_id
                          </div>
                          <div>
                            <span className="sql-keyword">WHERE</span> u.ad_tracking = <span className="sql-string">'DISABLED'</span>
                          </div>
                          <div>
                            <span className="sql-keyword">GROUP BY</span> u.id <span className="sql-keyword">LIMIT</span> 3;
                          </div>
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#98C379', fontSize: '11px' }}>
                            ✓ Query executed in 4.2ms · 3 rows returned
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                      <div className="tab-panel tab-panel--active" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '12.5px', color: 'var(--ink)' }}>@aditi</strong>
                            <span style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>10:42 AM</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>
                            "Love that our group discussions aren't scanned for keyword advertising. True privacy."
                          </p>
                        </div>

                        <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(194, 107, 77, 0.08)', border: '1px solid var(--line-clay)', alignSelf: 'flex-end', maxWidth: '85%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '12.5px', color: 'var(--clay-deep)' }}>You</strong>
                            <span style={{ fontSize: '11px', color: 'var(--ink-mute)' }}>Just now</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>
                            "And the direct SQL studio lets us inspect the real relational schema anytime!"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <footer className="panel__foot">
                    <span className="panel__foot-text">Sovereign &amp; Synced quietly across all your devices</span>
                    <span className="panel__foot-sync" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </footer>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* METRICS STRIP */}
        {/* ============================================================ */}
        <section className="metrics-strip">
          <div className="metrics-strip__inner">
            <div className="metric-box">
              <span className="metric-box__val">100%</span>
              <span className="metric-box__label">Ad-Free Forever</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">0</span>
              <span className="metric-box__label">Third-Party Trackers</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">17</span>
              <span className="metric-box__label">Relational Tables</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">Argon2</span>
              <span className="metric-box__label">Cryptographic Auth</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">&lt; 15ms</span>
              <span className="metric-box__label">Query Latency</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PRIVACY-FIRST ARCHITECTURE (USER'S EXPLICIT REQUEST) */}
        {/* ============================================================ */}
        <section className="privacy-section" id="privacy">
          <div className="section-head">
            <span className="eyebrow eyebrow--center">
              <span className="eyebrow__dot"></span>
              Core Architectural Commitment
            </span>
            <h2 className="section-title">Privacy First. <em>By Design,</em> not by accident.</h2>
            <p className="section-lede">
              Traditional social networks treat your habits, private messages, and attention as commodities to sell to advertisers.
              SocialSphere flips the model: you are the owner, not the product.
            </p>
          </div>

          <div className="privacy-grid">
            {/* Pillar 1 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--sage">
                  <EyeOff size={24} />
                </div>
                <span className="privacy-card__badge">Zero Tracking</span>
              </div>
              <h3 className="privacy-card__title">Zero Surveillance &amp; Telemetry</h3>
              <p className="privacy-card__body">
                We have eliminated all third-party tracking scripts, advertising SDKs, and cross-site behavioral cookies. Your dwell time, reading patterns, and clicks are never analyzed or brokered.
              </p>
              <div className="privacy-card__footer">
                <ShieldCheck size={14} /> No tracking pixels or fingerprinting
              </div>
            </article>

            {/* Pillar 2 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--clay">
                  <Key size={24} />
                </div>
                <span className="privacy-card__badge">Security</span>
              </div>
              <h3 className="privacy-card__title">Cryptographic Identity Safety</h3>
              <p className="privacy-card__body">
                Passwords are never stored in plaintext — only cryptographically salted and hashed using modern Argon2 &amp; Bcrypt algorithms. Protected tokens secure all API sessions against unauthorized replay.
              </p>
              <div className="privacy-card__footer">
                <Lock size={14} /> Multi-pass cryptographic salting
              </div>
            </article>

            {/* Pillar 3 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--sand">
                  <Layers size={24} />
                </div>
                <span className="privacy-card__badge">Permissions</span>
              </div>
              <h3 className="privacy-card__title">Granular Audience Scoping</h3>
              <p className="privacy-card__body">
                Every story, note, or discussion has explicit visibility boundaries. Choose between Public broadcast, Mutual Circle Only, or a completely Private Personal Journal with zero external visibility.
              </p>
              <div className="privacy-card__footer">
                <Check size={14} /> Explicit audience boundaries
              </div>
            </article>

            {/* Pillar 4 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--plum">
                  <Download size={24} />
                </div>
                <span className="privacy-card__badge">Sovereignty</span>
              </div>
              <h3 className="privacy-card__title">Complete Data Portability &amp; Wipe</h3>
              <p className="privacy-card__body">
                Your data is never trapped in a walled garden. Export your entire digital history in standard JSON or SQL dump format anytime. If you choose to delete your account, every row is wiped permanently.
              </p>
              <div className="privacy-card__footer">
                <Server size={14} /> Permanent right-to-be-forgotten
              </div>
            </article>

            {/* Pillar 5 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--clay">
                  <MessageSquare size={24} />
                </div>
                <span className="privacy-card__badge">Conversations</span>
              </div>
              <h3 className="privacy-card__title">Private Direct &amp; Group Channels</h3>
              <p className="privacy-card__body">
                Send 1-on-1 direct messages or join focused community groups without advertising bots, automated message scanning, or algorithmic demotion of external links.
              </p>
              <div className="privacy-card__footer">
                <Check size={14} /> No message scanning for ad targeting
              </div>
            </article>

            {/* Pillar 6 */}
            <article className="privacy-card">
              <div className="privacy-card__header">
                <div className="privacy-card__icon privacy-card__icon--sage">
                  <Sparkles size={24} />
                </div>
                <span className="privacy-card__badge">Algorithmic Calm</span>
              </div>
              <h3 className="privacy-card__title">Chronological &amp; Topic Control</h3>
              <p className="privacy-card__body">
                No black-box recommendation feeds designed to generate rage or addiction loops. Posts appear in natural chronological order or under topics you explicitly elect to follow.
              </p>
              <div className="privacy-card__footer">
                <Heart size={14} /> Calm human pacing, no engagement traps
              </div>
            </article>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PLATFORM COMPARISON MATRIX (MANIFESTO) */}
        {/* ============================================================ */}
        <section className="manifesto-section" id="manifesto">
          <div className="section-head">
            <span className="eyebrow eyebrow--center">
              <span className="eyebrow__dot"></span>
              Clear Comparison
            </span>
            <h2 className="section-title">Surveillance Tech vs. <em>SocialSphere</em></h2>
            <p className="section-lede">
              Compare the underlying philosophy of conventional big tech platforms against our privacy-first relational platform.
            </p>
          </div>

          <div className="comparison-wrapper">
            <div className="comparison-table-card">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th className="col-feature">Dimension</th>
                    <th className="col-bigtech">Traditional Big Tech Social</th>
                    <th className="col-ours">SocialSphere</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="col-feature">Behavioral Advertising</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ Ubiquitous ads every 3rd post</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ 100% Ad-Free, forever</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Data Tracking &amp; Brokerage</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ Clicks, dwell time sold to brokers</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Zero third-party telemetry scripts</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Feed Algorithm</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ Optimized for rage &amp; addictive doomscroll</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Pure chronological &amp; chosen topics</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Data Ownership &amp; Export</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ Incomplete exports, hidden archives</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Instant 1-click SQL/JSON data dump</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Database Transparency</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ Opaque black box walled garden</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Built-in Live SQL Studio across 17 tables</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Account Deletion</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ 30-day "grace periods" with shadow retention</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Immediate, permanent database row wipe</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="col-feature">Client Application</td>
                    <td className="col-bigtech">
                      <span className="badge-cross">✕ 300MB+ battery-draining native app bloat</span>
                    </td>
                    <td className="col-ours">
                      <span className="badge-check">✓ Lightweight &lt;2MB installable offline PWA</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TECHNICAL ARCHITECTURE & SQL STUDIO */}
        {/* ============================================================ */}
        <section className="tech-section" id="tech">
          <div className="section-head">
            <span className="eyebrow eyebrow--center">
              <span className="eyebrow__dot"></span>
              Engineering Excellence
            </span>
            <h2 className="section-title">Built on an <em>Open, High-Speed</em> Stack.</h2>
            <p className="section-lede">
              SocialSphere combines asynchronous Python FastAPI performance with normalized relational database models, live interactive SQL queries, and PWA offline capabilities.
            </p>
          </div>

          <div className="tech-grid">
            {/* Tech Card 1: Architecture Specs */}
            <div className="tech-card">
              <div>
                <span className="privacy-card__badge" style={{ marginBottom: '16px', display: 'inline-block' }}>
                  Architecture Blueprint
                </span>
                <h3 className="privacy-card__title" style={{ fontSize: '24px' }}>
                  High-Throughput Relational Core
                </h3>
                <p className="privacy-card__body">
                  Engineered with a clean separation of concerns. The API leverages non-blocking event loops, connection pooling, and GZip compression delivering 70%+ payload reductions.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                    <Server size={18} color="var(--clay)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>FastAPI Core:</strong> Asynchronous REST endpoints with auto-generated OpenAPI documentation.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                    <Database size={18} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>17 Normalized Tables:</strong> Relational schema covering posts, comments, reactions, groups, messages, followers, and audit logs.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                    <Smartphone size={18} color="var(--sand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>PWA Offline Sync:</strong> Install directly onto iOS, Android, macOS, and Windows with Service Worker caching.</span>
                  </li>
                </ul>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => openAuth('login')}
                  style={{ width: '100%' }}
                >
                  <span>Launch Live SQL Studio</span>
                  <Terminal size={16} />
                </button>
              </div>
            </div>

            {/* Tech Card 2: Live SQL Studio Mockup */}
            <div className="tech-card" style={{ background: '#18120D', color: '#F8F2E7', border: '1px solid rgba(248, 242, 231, 0.12)' }}>
              <div>
                <div className="terminal-dots">
                  <div className="terminal-dot terminal-dot--red"></div>
                  <div className="terminal-dot terminal-dot--yellow"></div>
                  <div className="terminal-dot terminal-dot--green"></div>
                  <span style={{ fontSize: '11.5px', color: '#A09489', marginLeft: 'auto', fontFamily: 'monospace' }}>
                    SQL Studio · schema_mysql.sql
                  </span>
                </div>

                <div style={{ fontFamily: 'monospace', fontSize: '12.5px', lineHeight: 1.6, color: '#D4C8BC' }}>
                  <p style={{ color: '#7F848E', margin: '0 0 8px 0' }}>
                    -- Explore active relational tables in SocialSphere
                  </p>
                  <p style={{ margin: 0 }}>
                    <span className="sql-keyword">SELECT</span> table_name, row_count, engine
                  </p>
                  <p style={{ margin: 0 }}>
                    <span className="sql-keyword">FROM</span> <span className="sql-table">information_schema.tables</span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <span className="sql-keyword">WHERE</span> table_schema = <span className="sql-string">'social_media'</span>;
                  </p>

                  <div style={{ margin: '14px 0', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', color: '#E5C07B', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                      <span>TABLE_NAME</span>
                      <span>ROWS</span>
                      <span>ENGINE</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', color: '#98C379', paddingTop: '4px' }}>
                      <span>users</span>
                      <span>1,248</span>
                      <span>InnoDB</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', color: '#98C379' }}>
                      <span>posts</span>
                      <span>8,914</span>
                      <span>InnoDB</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', color: '#98C379' }}>
                      <span>messages</span>
                      <span>24,190</span>
                      <span>InnoDB</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', color: '#98C379' }}>
                      <span>groups</span>
                      <span>142</span>
                      <span>InnoDB</span>
                    </div>
                  </div>

                  <p style={{ color: '#61AFEF', margin: 0 }}>
                    ⚡ 17 relational tables indexed &amp; ready for inspection.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: '#A09489' }}>
                  Execution safety: READ-ONLY sandboxing enabled
                </span>
                <span style={{ fontSize: '11.5px', color: '#98C379', fontWeight: 600 }}>
                  ● Connection Pool Ready
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
        {/* ============================================================ */}
        <section className="faq-section" id="faq">
          <div className="section-head">
            <span className="eyebrow eyebrow--center">
              <span className="eyebrow__dot"></span>
              Clear Answers
            </span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-lede">
              Transparent answers regarding our privacy safeguards, data handling, and technical foundation.
            </p>
          </div>

          <div className="faq-list">
            <details className="faq-item" open>
              <summary className="faq-summary">
                <span>How does SocialSphere guarantee a privacy-first experience?</span>
                <div className="faq-icon">
                  <ChevronDown size={16} />
                </div>
              </summary>
              <div className="faq-content">
                We have architected SocialSphere with zero advertising SDKs, zero third-party telemetry, and zero behavioral tracking cookies.
                Unlike traditional platforms that sell user engagement metrics to data brokers, our business model never monetizes your private attention or habits.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>Can I export or delete all my account data?</span>
                <div className="faq-icon">
                  <ChevronDown size={16} />
                </div>
              </summary>
              <div className="faq-content">
                Yes. You have full data sovereignty. You can export all your posts, profile information, relationships, and direct interactions in standard SQL or JSON formats with one click.
                Additionally, if you delete your account, your data is irrevocably removed from our relational database tables — no 30-day "retention shadows" or permanent archiving.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>What is the Live SQL Studio and who can use it?</span>
                <div className="faq-icon">
                  <ChevronDown size={16} />
                </div>
              </summary>
              <div className="faq-content">
                The Live SQL Studio is an interactive database terminal built directly into SocialSphere. It allows developers, analysts, and students to query the 17 relational database tables in real-time, inspect database schemas, test queries, and view execution latency metrics.
                Admins and authorized users can access the full studio at <code>/sql</code>.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>Can I install this on my iPhone, Android, or desktop?</span>
                <div className="faq-icon">
                  <ChevronDown size={16} />
                </div>
              </summary>
              <div className="faq-content">
                Yes! SocialSphere is an installable Progressive Web App (PWA). You can tap "Install App" or "Add to Home Screen" in your browser on iOS, Android, Windows, or Mac.
                It runs in standalone full-screen mode, supports offline caching, and consumes less than 2MB of storage without draining your battery.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                <span>How are user passwords and sessions secured?</span>
                <div className="faq-icon">
                  <ChevronDown size={16} />
                </div>
              </summary>
              <div className="faq-content">
                User passwords are protected with cryptographic salting and hashing using industry-standard Argon2 and Bcrypt algorithms.
                Authenticated sessions are managed via secure, stateless tokens with strict CORS and origin-level verification.
              </div>
            </details>
          </div>

          {/* Trust strip */}
          <div className="trust-strip">
            <div className="trust-item">
              <ShieldCheck size={16} />
              <span>Zero Surveillance Capital</span>
            </div>
            <div className="trust-item">
              <Lock size={16} />
              <span>Argon2 Cryptographic Auth</span>
            </div>
            <div className="trust-item">
              <Database size={16} />
              <span>17 Relational Tables</span>
            </div>
            <div className="trust-item">
              <Zap size={16} />
              <span>GZip Compressed Fast API</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FOOTER */}
        {/* ============================================================ */}
        <footer className="foot" id="about">
          <div className="foot__inner">
            <div className="foot__brand">
              <span className="brand__mark brand__mark--sm" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 21c0-5 3-9 8-10-1 6-4 10-8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M12 21c0-5-3-9-8-10 1 6 4 10 8 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </span>
              <span>SocialSphere — Privacy-First Social Architecture &amp; SQL Studio</span>
            </div>
            <div className="foot__links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#manifesto">Manifesto</a>
              <a href="#tech">SQL Architecture</a>
              <a href="#faq">FAQ</a>
              <button
                type="button"
                onClick={() => openAuth('login')}
                style={{ color: 'var(--clay-deep)', fontWeight: 600 }}
              >
                Sign In
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* ============================================================ */}
      {/* AUTHENTICATION MODAL */}
      {/* ============================================================ */}
      {authModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(42, 31, 24, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.25s ease',
          }}
          onClick={closeAuth}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--line-clay)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-xl)',
              padding: '36px 32px',
              position: 'relative',
              animation: 'scaleInPop 0.28s var(--ease-out)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
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
                color: 'var(--ink-mute)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)';
                e.currentTarget.style.background = 'var(--bg-card-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ink-mute)';
                e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(194, 107, 77, 0.12)',
                  color: 'var(--clay)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  marginBottom: '4px',
                  letterSpacing: '-0.01em',
                }}
              >
                {authModal === 'login' ? 'Welcome Back' : 'Create Free Account'}
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-soft)' }}>
                {authModal === 'login'
                  ? 'Access your calm, surveillance-free social space.'
                  : 'Zero tracking. Full data sovereignty. Join in seconds.'}
              </p>
            </div>

            {/* Modal Switch Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line)',
                padding: '4px',
                borderRadius: '100px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthModal('login');
                }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: authModal === 'login' ? 600 : 500,
                  color: authModal === 'login' ? 'var(--ink)' : 'var(--ink-mute)',
                  background: authModal === 'login' ? 'var(--bg-card)' : 'transparent',
                  boxShadow: authModal === 'login' ? 'var(--shadow-sm)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthModal('register');
                }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: authModal === 'register' ? 600 : 500,
                  color: authModal === 'register' ? 'var(--ink)' : 'var(--ink-mute)',
                  background: authModal === 'register' ? 'var(--bg-card)' : 'transparent',
                  boxShadow: authModal === 'register' ? 'var(--shadow-sm)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(194, 107, 77, 0.1)',
                  border: '1px solid var(--line-clay)',
                  color: 'var(--clay-deep)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {/* Login Form */}
            {authModal === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                    }}
                  >
                    Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ink-mute)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="e.g. aditi or rajarshi"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                      autoComplete="username"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid var(--line-strong)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-card)';
                        e.target.style.borderColor = 'var(--clay)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(194, 107, 77, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-elevated)';
                        e.target.style.borderColor = 'var(--line-strong)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ink-mute)',
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid var(--line-strong)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-card)';
                        e.target.style.borderColor = 'var(--clay)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(194, 107, 77, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-elevated)';
                        e.target.style.borderColor = 'var(--line-strong)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '13px 20px',
                    borderRadius: '100px',
                  }}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  {!loading && (
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
            )}

            {/* Registration Form */}
            {authModal === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                    }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Chen"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--line-strong)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-card)';
                      e.target.style.borderColor = 'var(--clay)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(194, 107, 77, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-elevated)';
                      e.target.style.borderColor = 'var(--line-strong)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                    }}
                  >
                    Username *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ink-mute)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Choose unique username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      autoComplete="username"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid var(--line-strong)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-card)';
                        e.target.style.borderColor = 'var(--clay)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(194, 107, 77, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-elevated)';
                        e.target.style.borderColor = 'var(--line-strong)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      marginBottom: '6px',
                    }}
                  >
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ink-mute)',
                      }}
                    />
                    <input
                      type="password"
                      placeholder="At least 4 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid var(--line-strong)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-card)';
                        e.target.style.borderColor = 'var(--clay)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(194, 107, 77, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-elevated)';
                        e.target.style.borderColor = 'var(--line-strong)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '13px 20px',
                    borderRadius: '100px',
                  }}
                >
                  <span>{loading ? 'Creating space...' : 'Create Account'}</span>
                  {!loading && (
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Credentials */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px dashed var(--line-strong)',
                fontSize: '12px',
                color: 'var(--ink-mute)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Quick demo credentials:</span>
                <span style={{ color: 'var(--clay-deep)', fontWeight: 600 }}>aditi / aditi123</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => {
                      setLoginUsername(p.username);
                      setLoginPassword(p.pass);
                      setAuthModal('login');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--line)',
                      fontSize: '11px',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    fill @{p.username}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
