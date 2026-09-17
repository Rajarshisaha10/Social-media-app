import React, { useState, useEffect } from 'react';

export default function NexoMascot({ className = '', onReact, showTip = false, tipText = '' }) {
  const [blinking, setBlinking] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 300);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  const handleClick = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
    if (onReact) onReact();
  };

  return (
    <div
      className={`mascot ${blinking ? 'blink' : ''} ${animating ? 'mascot-wave mascot-jump' : ''} ${className}`}
      onClick={handleClick}
      title="Click to interact with Nexo!"
      style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}
    >
      <svg viewBox="0 0 200 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2D55" />
            <stop offset="100%" stopColor="#2563FF" />
          </linearGradient>
          <linearGradient id="armGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2D55" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="armGradR" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563FF" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <radialGradient id="bodyShine" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="200" rx="55" ry="8" fill="#0A0E27" opacity="0.12" />

        {/* Antenna */}
        <line x1="100" y1="35" x2="100" y2="60" stroke="#0A0E27" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="28" r="9" fill="#FFD93D">
          <animate attributeName="r" values="9;11;9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="97" cy="25" r="3" fill="white" opacity="0.7" />

        {/* Arms */}
        <ellipse cx="38" cy="135" rx="11" ry="22" fill="url(#armGradL)" transform="rotate(-30 38 135)" />
        <g className="arm-right">
          <ellipse cx="162" cy="135" rx="11" ry="22" fill="url(#armGradR)" transform="rotate(30 162 135)" />
        </g>

        {/* Body */}
        <circle cx="100" cy="115" r="62" fill="url(#bodyGrad)" />
        <circle cx="100" cy="115" r="62" fill="url(#bodyShine)" />

        {/* Cheeks */}
        <ellipse cx="62" cy="135" rx="9" ry="6" fill="#FF2D55" opacity="0.5" />
        <ellipse cx="138" cy="135" rx="9" ry="6" fill="#FF2D55" opacity="0.4" />

        {/* Eyes */}
        <circle cx="78" cy="110" r="15" fill="white" />
        <circle cx="80" cy="113" r="8" fill="#0A0E27" className="pupil" />
        <circle cx="83" cy="109" r="2.5" fill="white" />

        <circle cx="122" cy="110" r="15" fill="white" />
        <circle cx="124" cy="113" r="8" fill="#0A0E27" className="pupil" />
        <circle cx="127" cy="109" r="2.5" fill="white" />

        {/* Smile */}
        <path d="M 82 138 Q 100 152 118 138" stroke="#0A0E27" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 95 145 Q 100 150 105 145" stroke="#FF2D55" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Feet */}
        <ellipse cx="78" cy="178" rx="14" ry="6" fill="#0A0E27" opacity="0.85" />
        <ellipse cx="122" cy="178" rx="14" ry="6" fill="#0A0E27" opacity="0.85" />
      </svg>
    </div>
  );
}
