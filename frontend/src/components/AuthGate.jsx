import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthGate() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    location: '',
    interests: '',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;
    setLoading(true);
    setError('');
    try {
      await login(loginUsername, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(regData);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-gate-wrapper animate-fade-in">
      <div className="auth-gate-box">
        <div>
          <div className="auth-logo">SocialSphere</div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Next-Gen High Speed Social & SQL Studio
          </p>
        </div>

        <div className="auth-toggle-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--red-light)',
              color: 'var(--red-accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              className="auth-input"
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              className="auth-input"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '42px', marginTop: '6px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              className="auth-input"
              placeholder="Username *"
              value={regData.username}
              onChange={(e) => setRegData({ ...regData, username: e.target.value })}
              required
            />
            <input
              type="email"
              className="auth-input"
              placeholder="Email address *"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              required
            />
            <input
              type="password"
              className="auth-input"
              placeholder="Password (4+ chars) *"
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              required
            />
            <input
              type="text"
              className="auth-input"
              placeholder="Bio (optional)"
              value={regData.bio}
              onChange={(e) => setRegData({ ...regData, bio: e.target.value })}
            />
            <input
              type="text"
              className="auth-input"
              placeholder="Location (City, Country)"
              value={regData.location}
              onChange={(e) => setRegData({ ...regData, location: e.target.value })}
            />
            <input
              type="text"
              className="auth-input"
              placeholder="Interests (e.g. React, Databases)"
              value={regData.interests}
              onChange={(e) => setRegData({ ...regData, interests: e.target.value })}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '42px', marginTop: '6px' }}
            >
              {loading ? 'Creating...' : 'Register Account'}
            </button>
          </form>
        )}


      </div>
    </div>
  );
}
