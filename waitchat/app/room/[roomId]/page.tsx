'use client';
// app/room/[roomId]/page.tsx — Main Chat Room
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import { useSocket } from '@/hooks/useSocket';
import { useTypingDetector } from '@/hooks/useTypingDetector';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { HoldBadge } from '@/components/chat/HoldBadge';
import { CaughtUpIndicator } from '@/components/chat/CaughtUpIndicator';
import { SettingsPanel } from '@/components/chat/SettingsPanel';
import type { Message, Room } from '@/lib/store';

interface TypingUser {
  userId: string;
  name: string;
}

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId ?? 'general';
  const router = useRouter();

  const { user, isLoading: userLoading } = useUser();
  const { socket, status, emit, on } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [flushTrigger, setFlushTrigger] = useState(0);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  const prevQueuedCount = useRef(0);

  // Settings state
  const [idleTimeout, setIdleTimeout] = useState(1500);
  const [enableOSHeuristic, setEnableOSHeuristic] = useState(true);

  // Redirect to landing if not logged in
  useEffect(() => {
    if (!userLoading && !user) router.push('/');
  }, [user, userLoading, router]);

  // 4-layer typing detection
  const { isTyping, source } = useTypingDetector(user?.id ?? null, {
    idleTimeout,
    enableOSHeuristic,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSettingsOpen(s => !s);
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Message queue (hold mechanic)
  const { visibleMessages, queuedCount, isHolding, flushNow } = useMessageQueue(
    allMessages,
    isTyping,
  );

  // Detect queue flush → trigger CaughtUp indicator
  useEffect(() => {
    if (prevQueuedCount.current > 0 && queuedCount === 0) {
      setFlushTrigger(t => t + 1);
    }
    prevQueuedCount.current = queuedCount;
  }, [queuedCount]);

  // Track new message IDs for animation
  useEffect(() => {
    const visibleIds = new Set(visibleMessages.map(m => m.id));
    setNewMessageIds(visibleIds);
    const t = setTimeout(() => setNewMessageIds(new Set()), 1000);
    return () => clearTimeout(t);
  }, [visibleMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load room + messages
  useEffect(() => {
    if (!user || !roomId) return;
    setMessagesLoading(true);

    fetch(`/api/rooms`)
      .then(r => r.json())
      .then(data => {
        const found = data.rooms?.find((r: Room) => r.id === roomId);
        if (found) setRoom(found);
      })
      .catch(() => {});

    fetch(`/api/rooms/${roomId}/messages`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages) setAllMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [roomId, user]);

  // Socket event handlers
  useEffect(() => {
    if (!user || !roomId || status !== 'connected') return;

    emit('room:join', { roomId, userId: user.id });

    const offNewMsg = on<Message & { tempId?: string }>('message:new', (msg) => {
      setAllMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    });

    const offTyping = on<{ userId: string; name: string; active: boolean }>('typing:update', (data) => {
      if (data.userId === user.id) return; // Don't show self
      setTypingUsers(prev => {
        if (data.active) {
          if (prev.find(u => u.userId === data.userId)) return prev;
          return [...prev, { userId: data.userId, name: data.name }];
        } else {
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    });

    const offReaction = on<{ messageId: string; reactions: Message['reactions'] }>('reaction:update', (data) => {
      setAllMessages(prev => prev.map(m =>
        m.id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    });

    return () => {
      offNewMsg();
      offTyping();
      offReaction();
      emit('room:leave', { roomId, userId: user.id });
    };
  }, [roomId, user, status, emit, on]);

  // Typing indicator to server (own keystrokes → tell others)
  const wasTypingRef = useRef(false);
  useEffect(() => {
    if (!user || !roomId || status !== 'connected') return;
    if (isTyping && !wasTypingRef.current) {
      emit('typing:start', { roomId, userId: user.id });
      wasTypingRef.current = true;
    } else if (!isTyping && wasTypingRef.current) {
      emit('typing:stop', { roomId, userId: user.id });
      wasTypingRef.current = false;
    }
  }, [isTyping, roomId, user, status, emit]);

  const handleSend = useCallback((content: string) => {
    if (!user || !roomId || status !== 'connected') return;
    const tempId = `temp-${Date.now()}`;
    emit('message:send', { roomId, userId: user.id, content, tempId });
  }, [user, roomId, status, emit]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    if (!user || status !== 'connected') return;
    emit('reaction:add', { messageId, roomId, emoji, userId: user.id });
  }, [user, roomId, status, emit]);

  if (userLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="animate-spin" style={{
          width: 40, height: 40, border: '2px solid var(--border)',
          borderTop: '2px solid var(--gold)', borderRadius: '50%',
        }} />
      </div>
    );
  }

  // Derive DM partner for display
  const isDm = room !== null && room.isGroup === false;
  const dmPartnerName = isDm && room && user
    ? (() => {
        // Room name is stored as "UserA & UserB"
        const parts = room.name.split(' & ');
        return parts.find(p => p.toLowerCase() !== user.name.toLowerCase()) ?? room.name;
      })()
    : undefined;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minWidth: 0,
      }}>
        <Header
          roomName={room?.name}
          onMenuClick={() => setSidebarOpen(true)}
          onSettingsClick={() => setSettingsOpen(s => !s)}
          memberCount={isDm ? undefined : room?.memberIds?.length}
          connectionStatus={status}
          isDm={isDm}
          dmPartnerName={dmPartnerName}
        />

        {/* Messages + hold mechanic area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <MessageList
            messages={visibleMessages}
            userId={user?.id ?? ''}
            typingUsers={typingUsers}
            onReact={handleReact}
            isLoading={messagesLoading}
            newMessageIds={newMessageIds}
          />

          {/* Hold Badge — floating when messages are queued */}
          {isHolding && (
            <HoldBadge count={queuedCount} onFlushNow={flushNow} />
          )}

          {/* Caught Up Indicator */}
          <CaughtUpIndicator trigger={flushTrigger} />

          {/* Typing source indicator (dev/debug) */}
          {isTyping && source && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'var(--hold-bg)',
              border: '1px solid var(--gold-dim)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 10px',
              fontSize: '10px',
              color: 'var(--gold-dim)',
              pointerEvents: 'none',
            }}>
              ⏸ {source}
            </div>
          )}
        </div>

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          disabled={status !== 'connected'}
          isTyping={isTyping}
          placeholder={
            status !== 'connected'
              ? 'Connecting to WaitChat...'
              : isDm && dmPartnerName
                ? `Message @${dmPartnerName}`
                : `Message #${room?.name ?? roomId}`
          }
        />
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          idleTimeout={idleTimeout}
          onIdleTimeoutChange={setIdleTimeout}
          enableOSHeuristic={enableOSHeuristic}
          onEnableOSHeuristicChange={setEnableOSHeuristic}
          onFlushNow={() => { flushNow(); setSettingsOpen(false); }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Settings panel overlay */}
      <style>{`
        @media (max-width: 768px) {
          .menu-btn { display: flex !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}
