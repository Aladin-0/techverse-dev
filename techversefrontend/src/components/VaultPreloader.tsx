import React, { useEffect, useState } from 'react';

// Global flag — preloader ONLY runs once per browser session.
// Navigating to /store and back NEVER re-triggers it.
let hasGloballyBooted = false;

export const VaultPreloader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(!hasGloballyBooted);

  useEffect(() => {
    if (hasGloballyBooted) return;

    // Animate progress bar quickly — 0→100 in ~800ms
    const start = performance.now();
    const DURATION = 800; // ms total fill time

    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(Math.round(p));

      if (p < 100) {
        requestAnimationFrame(tick);
      } else {
        // Fade out instantly once bar is full
        setTimeout(() => {
          setVisible(false);
          hasGloballyBooted = true;
        }, 300);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  if (!visible) return null;

  const fadeOut = progress >= 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fff',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'all',
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 40, height: 40, background: '#000', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>T</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: '#000', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
          Techverse
        </span>
      </div>

      {/* Thin progress bar */}
      <div style={{ width: 200, height: 2, background: 'rgba(0,0,0,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: '#000',
          borderRadius: 2,
          transition: 'width 0.05s linear',
        }} />
      </div>

      <span style={{
        marginTop: 16,
        fontSize: 10,
        color: 'rgba(0,0,0,0.35)',
        fontWeight: 600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
      }}>
        Loading Experience
      </span>
    </div>
  );
};
