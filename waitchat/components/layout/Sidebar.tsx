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

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
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
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(prev => [...prev, data.room]);
        setNewRoomName('');
        setShowCreateInput(false);
        router.push(`/room/${data.room.id}`);
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const currentRoomId = pathname.startsWith('/room/') ? pathname.split('/')[2] : null;

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

        {/* Rooms list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
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

          {rooms.map(room => {
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
                  fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0,
                  filter: isActive ? 'none' : 'grayscale(0.5)',
                }}>
                  {room.isGroup ? '#' : '💬'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {room.name}
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
