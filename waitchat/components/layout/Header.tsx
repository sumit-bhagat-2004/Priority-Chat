'use client';
// components/layout/Header.tsx
import { useThemeContext } from '@/components/ThemeProvider';

interface HeaderProps {
  roomName?: string;
  onMenuClick: () => void;
  onSettingsClick?: () => void;
  memberCount?: number;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  isDm?: boolean;
  dmPartnerName?: string;
}

export function Header({ roomName, onMenuClick, onSettingsClick, memberCount, connectionStatus = 'disconnected', isDm, dmPartnerName }: HeaderProps) {
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
        {isDm && dmPartnerName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#080808', flexShrink: 0,
            }}>
              {dmPartnerName[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{
                fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}>
                <span style={{ color: 'var(--gold)' }}>@</span>{dmPartnerName}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Direct Message</p>
            </div>
          </div>
        ) : roomName ? (
          <div>
            <h2 style={{
              fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              # {roomName}
            </h2>
            {memberCount !== undefined && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--online)', display: 'inline-block' }} />
                {memberCount} online
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
