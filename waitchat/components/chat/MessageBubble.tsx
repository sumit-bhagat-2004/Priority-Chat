'use client';
// components/chat/MessageBubble.tsx
import { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/lib/store';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✨'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReact: (messageId: string, emoji: string) => void;
  userId: string;
  isNew?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message, isOwn, onReact, userId, isNew = false,
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);

  const totalReactions = Object.values(message.reactions).reduce((s, arr) => s + arr.length, 0);
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });

  return (
    <div
      className={isNew ? 'message-enter' : ''}
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '2px 16px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: message.senderColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: '#080808',
          flexShrink: 0, marginBottom: '2px',
        }}>
          {message.senderName[0].toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: '70%', minWidth: '80px' }}>
        {/* Sender name */}
        {!isOwn && (
          <p style={{
            fontSize: '11px', color: message.senderColor,
            fontWeight: 600, marginBottom: '3px', paddingLeft: '2px',
          }}>
            {message.senderName}
          </p>
        )}

        {/* Bubble */}
        <div style={{
          background: isOwn ? 'var(--gold)' : 'var(--bg-elevated)',
          color: isOwn ? '#080808' : 'var(--text-primary)',
          borderRadius: isOwn
            ? 'var(--radius-lg) var(--radius-md) var(--radius-md) var(--radius-lg)'
            : 'var(--radius-md) var(--radius-lg) var(--radius-lg) var(--radius-md)',
          padding: '9px 13px',
          wordBreak: 'break-word',
          lineHeight: 1.5,
          border: isOwn ? 'none' : '1px solid var(--border)',
          position: 'relative',
        }}>
          <p style={{ fontSize: '14px' }}>{message.content}</p>

          <p style={{
            fontSize: '10px',
            color: isOwn ? 'rgba(0,0,0,0.5)' : 'var(--text-muted)',
            marginTop: '4px',
            textAlign: isOwn ? 'right' : 'left',
          }}>
            {timeAgo}
          </p>

          {/* Reactions */}
          {totalReactions > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                userIds.length > 0 && (
                  <button
                    key={emoji}
                    onClick={() => onReact(message.id, emoji)}
                    style={{
                      background: userIds.includes(userId)
                        ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.1)',
                      border: userIds.includes(userId)
                        ? '1px solid var(--gold-dim)' : '1px solid transparent',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px 7px',
                      fontSize: '12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '3px',
                      transition: 'all var(--transition-fast)',
                      color: isOwn ? '#080808' : 'var(--text-primary)',
                    }}
                  >
                    {emoji} <span style={{ fontSize: '10px' }}>{userIds.length}</span>
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <div className="animate-scale-in" style={{
          position: 'absolute',
          bottom: '100%',
          [isOwn ? 'right' : 'left']: isOwn ? '16px' : '44px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '8px',
          display: 'flex', gap: '4px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 10,
          marginBottom: '4px',
        }}>
          {EMOJI_OPTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              style={{
                background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: '18px',
                padding: '4px', borderRadius: '6px',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
