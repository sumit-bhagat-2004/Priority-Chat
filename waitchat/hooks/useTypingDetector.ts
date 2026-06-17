'use client';
// hooks/useTypingDetector.ts — The Core: 4-layer ruthless typing detection
import { useEffect, useRef, useState, useCallback } from 'react';

export interface TypingDetectorConfig {
  idleTimeout: number;       // ms before considering "stopped typing", default 1500
  ghostWindowMs: number;     // ms to hold after window blur, default 3000
  enableOSHeuristic: boolean; // Layer 4 ghost hold on blur, default true
}

export interface TypingDetectorReturn {
  isTyping: boolean;
  lastTypedAt: number | null;
  source: 'current-tab' | 'broadcast' | 'window-blur' | 'os-heuristic' | null;
}

const DEFAULT_CONFIG: TypingDetectorConfig = {
  idleTimeout: 1500,
  ghostWindowMs: 3000,
  enableOSHeuristic: true,
};

// Unique tab ID
const TAB_ID = typeof crypto !== 'undefined'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);

export function useTypingDetector(
  userId: string | null,
  config: Partial<TypingDetectorConfig> = {}
): TypingDetectorReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [isTyping, setIsTyping] = useState(false);
  const [source, setSource] = useState<TypingDetectorReturn['source']>(null);
  const [lastTypedAt, setLastTypedAt] = useState<number | null>(null);

  const idleTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghostTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef     = useRef<BroadcastChannel | null>(null);
  const isTypingRef    = useRef(false);
  const lastTypedRef   = useRef<number | null>(null);

  const setTyping = useCallback((val: boolean, src: TypingDetectorReturn['source']) => {
    isTypingRef.current = val;
    setIsTyping(val);
    setSource(val ? src : null);
    if (val) {
      const ts = Date.now();
      lastTypedRef.current = ts;
      setLastTypedAt(ts);
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setTyping(false, null);
      // Broadcast idle
      try {
        channelRef.current?.postMessage({
          type: 'typing:idle',
          userId,
          ts: Date.now(),
          tabId: TAB_ID,
        });
      } catch { /* ignore */ }
    }, cfg.idleTimeout);
  }, [cfg.idleTimeout, setTyping, userId]);

  const handleKeyActivity = useCallback((src: TypingDetectorReturn['source'] = 'current-tab') => {
    // Cancel ghost timer if active
    if (ghostTimerRef.current) {
      clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = null;
    }

    setTyping(true, src);
    startIdleTimer();

    // Broadcast to other tabs (Layer 2)
    if (src === 'current-tab') {
      try {
        channelRef.current?.postMessage({
          type: 'typing:active',
          userId,
          ts: Date.now(),
          tabId: TAB_ID,
        });
      } catch { /* ignore */ }
    }
  }, [setTyping, startIdleTimer, userId]);

  useEffect(() => {
    if (!userId) return;

    // ─── Layer 1: Current Tab ───
    const onKey = () => handleKeyActivity('current-tab');
    const onInput = () => handleKeyActivity('current-tab');
    const onComposition = () => handleKeyActivity('current-tab');

    document.addEventListener('keydown', onKey);
    document.addEventListener('input', onInput);
    document.addEventListener('compositionstart', onComposition);
    document.addEventListener('compositionupdate', onComposition);

    // ─── Layer 2: BroadcastChannel (cross same-origin tabs) ───
    try {
      const channel = new BroadcastChannel('waitchat-typing');
      channelRef.current = channel;

      channel.onmessage = (e) => {
        const { type, userId: fromUser, ts, tabId } = e.data;
        // Ignore our own messages and stale ones (> 5s)
        if (tabId === TAB_ID) return;
        if (Date.now() - ts > 5000) return;

        if (type === 'typing:active') {
          handleKeyActivity('broadcast');
        } else if (type === 'typing:idle') {
          // Only stop if we're not ourselves typing
          if (!isTypingRef.current) {
            setTyping(false, null);
          }
        }
      };
    } catch { /* BroadcastChannel not available */ }

    // ─── Layer 3 & 4: Window blur/focus ───
    const onBlur = () => {
      if (!cfg.enableOSHeuristic) return;

      const wasTypingRecently =
        lastTypedRef.current !== null &&
        Date.now() - lastTypedRef.current < 5000;

      if (wasTypingRecently && !isTypingRef.current) {
        // Extend ghost window: user may be typing in another app
        setTyping(true, 'window-blur');

        ghostTimerRef.current = setTimeout(() => {
          setTyping(false, null);
          ghostTimerRef.current = null;
        }, cfg.ghostWindowMs);
      } else if (isTypingRef.current) {
        // Was typing and switched — keep hold, extend by ghostWindowMs
        setTyping(true, 'os-heuristic');
        startIdleTimer(); // will fire after idleTimeout anyway
      }
    };

    const onFocus = () => {
      // If ghost timer is running, cancel it (user came back)
      if (ghostTimerRef.current) {
        clearTimeout(ghostTimerRef.current);
        ghostTimerRef.current = null;
        // Don't set typing=false — let idle timer handle it naturally
      }
    };

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('input', onInput);
      document.removeEventListener('compositionstart', onComposition);
      document.removeEventListener('compositionupdate', onComposition);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);

      try {
        channelRef.current?.postMessage({ type: 'typing:idle', userId, ts: Date.now(), tabId: TAB_ID });
        channelRef.current?.close();
      } catch { /* ignore */ }
    };
  }, [userId, cfg.enableOSHeuristic, cfg.ghostWindowMs, handleKeyActivity, setTyping, startIdleTimer]);

  return { isTyping, lastTypedAt, source };
}
