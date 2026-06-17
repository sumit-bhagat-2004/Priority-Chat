'use client';
// hooks/useMessageQueue.ts — Queue management with stagger flush
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message } from '@/lib/store';

export interface MessageQueueReturn {
  visibleMessages: Message[];
  queuedCount: number;
  isHolding: boolean;
  flushNow: () => void;
}

// Stagger constants
const BASE_STAGGER_MS = 120;
const MAX_BATCH_NO_STAGGER = 50; // Instant flush above this count

export function useMessageQueue(
  allMessages: Message[],
  isTyping: boolean
): MessageQueueReturn {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);
  const queueRef = useRef<Message[]>([]);
  const flushingRef = useRef(false);
  const allMessagesRef = useRef<Message[]>([]);
  const isTypingRef = useRef(isTyping);

  isTypingRef.current = isTyping;

  // On first load — show all messages immediately
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && allMessages.length > 0) {
      initializedRef.current = true;
      setVisibleMessages(allMessages);
      allMessagesRef.current = allMessages;
    }
  }, [allMessages]);

  const doFlush = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) return;
    flushingRef.current = true;

    if (msgs.length > MAX_BATCH_NO_STAGGER) {
      // Instant batch flush
      setVisibleMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = msgs.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMsgs].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
      setQueuedCount(0);
      queueRef.current = [];
      flushingRef.current = false;
      return;
    }

    // Stagger flush
    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setVisibleMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          return updated;
        });
        if (i === msgs.length - 1) {
          flushingRef.current = false;
          setQueuedCount(0);
          queueRef.current = [];
        }
      }, i * BASE_STAGGER_MS);
    });
  }, []);

  const flushNow = useCallback(() => {
    const toFlush = [...queueRef.current];
    queueRef.current = [];
    setQueuedCount(0);
    doFlush(toFlush);
  }, [doFlush]);

  // Watch for new messages
  useEffect(() => {
    if (!initializedRef.current) return;

    const prevIds = new Set(allMessagesRef.current.map(m => m.id));
    const newMsgs = allMessages.filter(m => !prevIds.has(m.id));
    allMessagesRef.current = allMessages;

    if (newMsgs.length === 0) return;

    if (isTypingRef.current) {
      // Queue them
      queueRef.current = [...queueRef.current, ...newMsgs];
      setQueuedCount(queueRef.current.length);
    } else {
      // Immediate render
      doFlush(newMsgs);
    }
  }, [allMessages, doFlush]);

  // When typing stops → flush queue
  useEffect(() => {
    if (!isTyping && queueRef.current.length > 0) {
      const toFlush = [...queueRef.current];
      queueRef.current = [];
      setQueuedCount(0);
      doFlush(toFlush);
    }
  }, [isTyping, doFlush]);

  return {
    visibleMessages,
    queuedCount,
    isHolding: isTyping && queuedCount > 0,
    flushNow,
  };
}
