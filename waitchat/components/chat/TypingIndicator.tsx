'use client';
// components/chat/TypingIndicator.tsx — "Alice is typing..."
interface TypingUser {
  userId: string;
  name: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  let label = '';
  if (typingUsers.length === 1) {
    label = `${typingUsers[0].name} is typing`;
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
  } else {
    label = `${typingUsers.length} people are typing`;
  }

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 16px',
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
    }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>{label}</span>
    </div>
  );
}
