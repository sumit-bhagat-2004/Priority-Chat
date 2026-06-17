'use client';
// components/chat/HoldBadge.tsx — "N messages waiting..." floating badge
import { useEffect, useState } from 'react';

interface HoldBadgeProps {
  count: number;
  onFlushNow: () => void;
}

export function HoldBadge({ count, onFlushNow }: HoldBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(count > 0);
  }, [count]);

  if (!visible) return null;

  return (
    <div
      className="hold-badge"
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--hold-bg)',
        border: '1px solid var(--gold-dim)',
        borderRadius: 'var(--radius-full)',
        padding: '8px 16px 8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1)',
        backdropFilter: 'blur(10px)',
        cursor: 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Hold icon (pause symbol) */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{ width: 2, height: 8, background: '#080808', borderRadius: 1 }} />
          <div style={{ width: 2, height: 8, background: '#080808', borderRadius: 1 }} />
        </div>
      </div>

      <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600 }}>
        {count} message{count !== 1 ? 's' : ''} waiting...
      </span>

      <button
        id="flush-now-btn"
        onClick={onFlushNow}
        style={{
          background: 'var(--gold)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          padding: '3px 10px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#080808',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
      >
        Show
      </button>
    </div>
  );
}
