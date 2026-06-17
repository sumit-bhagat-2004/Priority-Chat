'use client';
// components/chat/MessageInput.tsx
import { useState, useRef, useCallback, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isTyping?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled, isTyping, placeholder }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, onSend, disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      flexShrink: 0,
    }}>
      {/* Typing hold indicator */}
      {isTyping && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '6px',
          fontSize: '11px', color: 'var(--gold-dim)',
          fontStyle: 'italic',
          animation: 'borderGlow 2s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            <span className="typing-dot" style={{ background: 'var(--gold-dim)' }} />
            <span className="typing-dot" style={{ background: 'var(--gold-dim)' }} />
            <span className="typing-dot" style={{ background: 'var(--gold-dim)' }} />
          </div>
          <span>Holding incoming messages while you type...</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${isTyping ? 'var(--gold-dim)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '10px 12px',
        transition: 'border-color var(--transition-base)',
        boxShadow: isTyping ? '0 0 0 2px var(--gold-glow)' : 'none',
      }}>
        <textarea
          id="message-input"
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message... (Enter to send, Shift+Enter for newline)'}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: '1.5',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />

        <button
          id="send-btn"
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-md)',
            background: canSend ? 'var(--gold)' : 'var(--border)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-base)',
            flexShrink: 0,
            color: canSend ? '#080808' : 'var(--text-muted)',
            transform: canSend ? 'scale(1)' : 'scale(0.95)',
          }}
          title="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
        ↵ Send · ⇧↵ New line
      </p>
    </div>
  );
}
