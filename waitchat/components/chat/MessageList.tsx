'use client';
// components/chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/store';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  userId: string;
  typingUsers: Array<{ userId: string; name: string }>;
  onReact: (messageId: string, emoji: string) => void;
  isLoading?: boolean;
  newMessageIds?: Set<string>;
}

function SkeletonMessage({ isOwn }: { isOwn: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
      gap: '8px', padding: '4px 16px',
    }}>
      {!isOwn && <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />}
      <div style={{ maxWidth: '60%' }}>
        {!isOwn && <div className="skeleton" style={{ height: 10, width: 60, marginBottom: 6 }} />}
        <div className="skeleton" style={{
          height: 42, width: `${120 + Math.random() * 120}px`,
          borderRadius: 12,
        }} />
      </div>
    </div>
  );
}

export function MessageList({
  messages, userId, typingUsers, onReact, isLoading = false, newMessageIds,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const wasAtBottom = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    wasAtBottom.current = distFromBottom < 80;

    if (wasAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    lastScrollTop.current = container.scrollTop;
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <SkeletonMessage key={i} isOwn={i % 3 === 2} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '12px', color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '48px', opacity: 0.6 }}>💬</div>
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          No messages yet
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
          Be the first to say something. Messages are held while you type.
        </p>
      </div>
    );
  }

  // Group consecutive messages from same sender
  const grouped = messages.reduce<Array<Message & { showAvatar: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const showAvatar = !prev || prev.senderId !== msg.senderId;
    acc.push({ ...msg, showAvatar });
    return acc;
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column' }}
    >
      {grouped.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === userId}
          onReact={onReact}
          userId={userId}
          isNew={newMessageIds?.has(msg.id)}
        />
      ))}

      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
}
