'use client';
// components/chat/CaughtUpIndicator.tsx
import { useEffect, useState } from 'react';

interface CaughtUpIndicatorProps {
  trigger: number; // increment this to trigger the animation
}

export function CaughtUpIndicator({ trigger }: CaughtUpIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className="caught-up"
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)',
        padding: '6px 16px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--shadow-md)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: 'var(--gold)' }}>✓</span>
      You&apos;re all caught up
    </div>
  );
}
