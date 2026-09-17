import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA / mobile app mode
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if running on iOS (Safari requires manual Add to Home Screen)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Listen for Android / Chrome / Edge beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check session storage if user previously dismissed in this session
    if (sessionStorage.getItem('pwa_prompt_dismissed') === 'true') {
      setDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // If already installed/standalone or dismissed, don't show
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if we either have a deferred prompt (Android/Chrome/Desktop) OR user is on iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User response to install prompt:', outcome);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Mobile / Desktop App Banner */}
      <div
        style={{
          position: 'fixed',
          bottom: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          width: 'calc(100% - 24px)',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface-elevated, #ffffff)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-elevated)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            <Smartphone size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Use as Mobile App
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Install SocialSphere for offline access & full screen
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleInstallClick}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12.5px',
            }}
            aria-label="Install SocialSphere App"
          >
            <Download size={14} />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Dismiss"
            aria-label="Dismiss app install banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div
          className="modal-overlay"
          onClick={() => setShowIOSGuide(false)}
          style={{ zIndex: 100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', textAlign: 'center', padding: '24px' }}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowIOSGuide(false)}
            >
              ✕
            </button>

            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--blue-light)',
                color: 'var(--blue-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <Smartphone size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              Install on iPhone / iPad
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Install SocialSphere to your home screen for full-screen view and quick launch:
            </p>

            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--blue-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  1
                </div>
                <span>
                  Tap the Safari <strong>Share</strong> button <Share size={15} style={{ verticalAlign: 'middle', display: 'inline' }} />
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--blue-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  2
                </div>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={15} style={{ verticalAlign: 'middle', display: 'inline' }} />
                </span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowIOSGuide(false)}
              style={{ width: '100%', padding: '10px', borderRadius: '12px' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
