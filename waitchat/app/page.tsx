'use client';
// app/page.tsx — Landing / Username Entry
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import { useThemeContext } from '@/components/ThemeProvider';

export default function LandingPage() {
  const router = useRouter();
  const { user, setUser, isLoading } = useUser();
  const { theme, toggleTheme } = useThemeContext();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/room/general');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }
    if (trimmed.length > 24) { setError('Name must be at most 24 characters'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setUser(data.user);
      router.push('/room/general');
    } catch {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--gold)',
          borderRadius: '50%',
        }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(192,192,192,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 12px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '18px',
          transition: 'all var(--transition-base)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Main card */}
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 40px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}>
        {/* Gold accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: '20%', right: '20%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          borderRadius: 'var(--radius-full)',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px',
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            Wait<span style={{ color: 'var(--gold)' }}>Chat</span>
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            fontStyle: 'italic',
          }}>
            The chat that holds your world until you&apos;re ready.
          </p>
        </div>

        {/* The mechanic description */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '28px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
        }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>✦ The Rule:</span>{' '}
          Messages are held while you type — anywhere. Stop typing and the world floods back in.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Choose a display name
          </label>
          <input
            id="username-input"
            className="input-base"
            type="text"
            placeholder="e.g. alice, bob_42, nova..."
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            minLength={2}
            maxLength={24}
            autoFocus
            autoComplete="off"
            disabled={submitting}
            style={{ marginBottom: '6px' }}
          />

          {error && (
            <p style={{
              fontSize: '12px',
              color: '#B05050',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>⚠</span> {error}
            </p>
          )}

          <div style={{ height: error ? '0' : '16px' }} />

          <button
            id="enter-chat-btn"
            type="submit"
            className="btn-gold"
            disabled={submitting || name.trim().length < 2}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              opacity: (submitting || name.trim().length < 2) ? 0.6 : 1,
              cursor: (submitting || name.trim().length < 2) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="animate-spin" style={{
                  display: 'inline-block', width: 16, height: 16,
                  border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #000',
                  borderRadius: '50%',
                }} />
                Entering...
              </span>
            ) : 'Enter WaitChat →'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '24px',
          lineHeight: 1.6,
        }}>
          No password. No email. Just a name and a conversation.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '28px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { icon: '⏸', label: 'Hold while typing' },
          { icon: '⚡', label: 'Instant flush' },
          { icon: '🔀', label: 'Cross-tab sync' },
        ].map(f => (
          <span key={f.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {f.icon} {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
