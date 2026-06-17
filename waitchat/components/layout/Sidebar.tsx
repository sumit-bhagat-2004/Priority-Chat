'use client';
// components/layout/Sidebar.tsx
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import type { Room } from '@/lib/store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);

  // DM state
  const [dmUsername, setDmUsername] = useState('');
  const [dmError, setDmError] = useState('');
  const [dmLoading, setDmLoading] = useState(false);
  const [showDmInput, setShowDmInput] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName.trim() }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(prev => [...prev, data.room]);
        setNewRoomName('');
        setShowCreateInput(false);
        router.push(`/room/${data.room.id}`);
        onClose();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const startDm = async () => {
    const target = dmUsername.trim();
    if (!target) return;
    setDmError('');
    setDmLoading(true);
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: target }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setDmError(data.error ?? 'Could not start DM');
      } else {
        // Add room to list if not already there
        setRooms(prev => {
          if (prev.find(r => r.id === data.room.id)) return prev;
          return [...prev, data.room];
        });
        setDmUsername('');
        setShowDmInput(false);
        router.push(`/room/${data.room.id}`);
        onClose();
      }
    } catch {
      setDmError('Network error');
    }
    setDmLoading(false);
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const currentRoomId = pathname.startsWith('/room/') ? pathname.split('/')[2] : null;
  const groupRooms = rooms.filter(r => r.isGroup);
  const dmRooms = rooms.filter(r => !r.isGroup && r.memberIds?.includes(user?.id ?? ''));

  // Derive DM partner name for display
  const getDmPartnerName = (room: Room) => {
    if (!user) return room.name;
    // name is stored as "UserA & UserB"
    const parts = room.name.split(' & ');
    return parts.find(p => p.toLowerCase() !== user.name.toLowerCase()) ?? room.name;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 40, display: 'none',
          }}
          className="md-overlay"
          onClick={onClose}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform var(--transition-base)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              Wait<span style={{ color: 'var(--gold)' }}>Chat</span>
            </h1>
            <div style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: 'var(--online)',
              boxShadow: '0 0 6px var(--online)',
            }} />
          </div>

          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: user.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#080808',
                flexShrink: 0,
              }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', 
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online</p>
              </div>
              <button
                onClick={logout}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '16px', padding: '2px',
                  flexShrink: 0,
                }}
                title="Sign out"
              >
                ↪
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>

          {/* ── Rooms section ─────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 8px', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Rooms
            </span>
            <button
              onClick={() => setShowCreateInput(!showCreateInput)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--gold)', fontSize: '18px', lineHeight: 1,
                padding: '2px', borderRadius: '4px',
                transition: 'all var(--transition-base)',
              }}
              title="New room"
            >
              +
            </button>
          </div>

          {/* Create room input */}
          {showCreateInput && (
            <div className="animate-slide-down" style={{ padding: '0 8px', marginBottom: '8px' }}>
              <input
                className="input-base"
                placeholder="Room name..."
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createRoom(); if (e.key === 'Escape') setShowCreateInput(false); }}
                autoFocus
                style={{ fontSize: '13px', padding: '8px 10px', marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={createRoom} disabled={creating || !newRoomName.trim()}
                  className="btn-gold" style={{ flex: 1, padding: '7px', fontSize: '12px' }}>
                  {creating ? '...' : 'Create'}
                </button>
                <button onClick={() => setShowCreateInput(false)}
                  className="btn-ghost" style={{ padding: '7px 10px', fontSize: '12px' }}>
                  ✕
                </button>
              </div>
            </div>
          )}

          {groupRooms.map(room => {
            const isActive = room.id === currentRoomId;
            return (
              <button
                key={room.id}
                id={`room-${room.id}`}
                onClick={() => { router.push(`/room/${room.id}`); onClose(); }}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  marginBottom: '2px',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '25%', bottom: '25%',
                    width: '3px', background: 'var(--gold)',
                    borderRadius: 'var(--radius-full)',
                  }} />
                )}
                <span style={{
                  fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0,
                  color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  #
                </span>
                <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {room.name}
                </span>
              </button>
            );
          })}

          {/* ── Direct Messages section ───────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 8px', marginTop: '20px', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Direct Messages
            </span>
            <button
              onClick={() => { setShowDmInput(!showDmInput); setDmError(''); }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--gold)', fontSize: '18px', lineHeight: 1,
                padding: '2px', borderRadius: '4px',
                transition: 'all var(--transition-base)',
              }}
              title="New direct message"
            >
              +
            </button>
          </div>

          {/* DM input */}
          {showDmInput && (
            <div className="animate-slide-down" style={{ padding: '0 8px', marginBottom: '8px' }}>
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gold)', fontWeight: 600, fontSize: '13px', pointerEvents: 'none',
                }}>@</span>
                <input
                  className="input-base"
                  placeholder="username..."
                  value={dmUsername}
                  onChange={e => { setDmUsername(e.target.value); setDmError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') startDm(); if (e.key === 'Escape') setShowDmInput(false); }}
                  autoFocus
                  style={{ fontSize: '13px', padding: '8px 10px 8px 24px' }}
                />
              </div>
              {dmError && (
                <p style={{ fontSize: '11px', color: '#B05050', marginBottom: '6px', paddingLeft: '2px' }}>
                  ⚠ {dmError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={startDm}
                  disabled={dmLoading || !dmUsername.trim()}
                  className="btn-gold"
                  style={{ flex: 1, padding: '7px', fontSize: '12px' }}
                >
                  {dmLoading ? '...' : 'Open Chat'}
                </button>
                <button
                  onClick={() => { setShowDmInput(false); setDmError(''); }}
                  className="btn-ghost"
                  style={{ padding: '7px 10px', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Existing DM rooms */}
          {dmRooms.length === 0 && !showDmInput && (
            <div style={{
              padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              No direct messages yet
            </div>
          )}

          {dmRooms.map(room => {
            const isActive = room.id === currentRoomId;
            const partnerName = getDmPartnerName(room);
            return (
              <button
                key={room.id}
                id={`dm-${room.id}`}
                onClick={() => { router.push(`/room/${room.id}`); onClose(); }}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  marginBottom: '2px',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '25%', bottom: '25%',
                    width: '3px', background: 'var(--gold)',
                    borderRadius: 'var(--radius-full)',
                  }} />
                )}
                {/* Avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#080808',
                }}>
                  {partnerName[0].toUpperCase()}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {partnerName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom settings hint */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          WaitChat v1.0 · <span style={{ color: 'var(--gold-dim)' }}>Hackathon Edition</span>
        </div>
      </aside>
    </>
  );
}
