'use client';
// components/layout/Header.tsx
import { useThemeContext } from '@/components/ThemeProvider';

interface HeaderProps {
  roomName?: string;
  onMenuClick: () => void;
  onSettingsClick?: () => void;
  memberCount?: number;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function Header({ roomName, onMenuClick, onSettingsClick, memberCount, connectionStatus = 'disconnected' }: HeaderProps) {
  const { theme, toggleTheme } = useThemeContext();

  const statusColor = {
    connected:    'var(--online)',
    connecting:   'var(--gold)',
    disconnected: 'var(--offline)',
    error:        '#B05050',
  }[connectionStatus];

  const statusLabel = {
    connected:    'Connected',
    connecting:   'Connecting...',
    disconnected: 'Offline',
    error:        'Error',
  }[connectionStatus];

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '16px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Menu button (mobile) */}
      <button
        id="menu-btn"
        onClick={onMenuClick}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '18px',
          padding: '6px', display: 'none',
        }}
        className="menu-btn"
        title="Menu"
      >
        ☰
      </button>

      {/* Room name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {roomName ? (
          <div>
            <h2 style={{
              fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              # {roomName}
            </h2>
            {memberCount !== undefined && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        ) : (
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px', color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Wait<span style={{ color: 'var(--gold)' }}>Chat</span>
          </h2>
        )}
      </div>

      {/* Connection status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusColor,
          boxShadow: connectionStatus === 'connected' ? `0 0 6px ${statusColor}` : 'none',
        }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {statusLabel}
        </span>
      </div>

      {/* Settings button */}
      {onSettingsClick && (
        <button
          id="settings-btn"
          onClick={onSettingsClick}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all var(--transition-base)',
            color: 'var(--text-secondary)',
          }}
          title="Settings"
        >
          ⚙
        </button>
      )}

      {/* Theme toggle */}
      <button
        id="theme-toggle-btn"
        onClick={toggleTheme}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'all var(--transition-base)',
          color: 'var(--text-secondary)',
        }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
