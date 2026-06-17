'use client';
// components/chat/SettingsPanel.tsx — Settings for the hold mechanic
import { useThemeContext } from '@/components/ThemeProvider';

interface SettingsPanelProps {
  idleTimeout: number;
  onIdleTimeoutChange: (val: number) => void;
  enableOSHeuristic: boolean;
  onEnableOSHeuristicChange: (val: boolean) => void;
  onFlushNow: () => void;
  onClose: () => void;
}

export function SettingsPanel({
  idleTimeout,
  onIdleTimeoutChange,
  enableOSHeuristic,
  onEnableOSHeuristicChange,
  onFlushNow,
  onClose,
}: SettingsPanelProps) {
  const { theme, toggleTheme, manualOverride, resetToAuto } = useThemeContext();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div className="animate-slide-down" style={{
        position: 'fixed',
        top: '70px',
        right: '16px',
        width: '320px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        zIndex: 50,
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ⚙ Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '18px', padding: '2px',
            }}
          >✕</button>
        </div>

        {/* Hold Mechanic section */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', 
            textTransform: 'uppercase', marginBottom: '14px' }}>
            Hold Mechanic
          </p>

          {/* Idle timeout slider */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Typing idle timeout
              </label>
              <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {idleTimeout}ms
              </span>
            </div>
            <input
              id="idle-timeout-slider"
              type="range"
              min={500}
              max={5000}
              step={100}
              value={idleTimeout}
              onChange={e => onIdleTimeoutChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--gold)',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>500ms (snappy)</span>
              <span>5s (patient)</span>
            </div>
          </div>

          {/* OS Heuristic toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Extend hold when switching apps
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Layer 4: OS heuristic (3s ghost window)
              </p>
            </div>
            <button
              id="os-heuristic-toggle"
              onClick={() => onEnableOSHeuristicChange(!enableOSHeuristic)}
              style={{
                width: 40, height: 22,
                borderRadius: 11,
                background: enableOSHeuristic ? 'var(--gold)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background var(--transition-base)',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3, left: enableOSHeuristic ? 21 : 3,
                width: 16, height: 16,
                borderRadius: '50%',
                background: 'white',
                transition: 'left var(--transition-base)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* Manual flush */}
          <button
            id="manual-flush-btn"
            onClick={onFlushNow}
            className="btn-ghost"
            style={{ width: '100%', fontSize: '13px' }}
          >
            ⚡ Flush message queue now
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: '20px' }} />

        {/* Theme section */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--silver-dark)', letterSpacing: '0.1em', 
            textTransform: 'uppercase', marginBottom: '14px' }}>
            Theme
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Current: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {manualOverride ? 'Manually overridden' : 'Auto (06:00–18:00 light)'}
              </p>
            </div>
            <button
              id="theme-settings-btn"
              onClick={toggleTheme}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              Toggle
            </button>
          </div>

          {manualOverride && (
            <button
              onClick={resetToAuto}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '11px', color: 'var(--gold-dim)', textDecoration: 'underline',
                padding: 0,
              }}
            >
              Reset to auto (time-based)
            </button>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

        {/* Info */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
        }}>
          <p style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '4px' }}>Why are messages delayed?</p>
          WaitChat holds all incoming messages while you type — in any tab or app. This lets you compose your thoughts without interruption. Messages flood back the moment you stop.
        </div>
      </div>
    </>
  );
}
