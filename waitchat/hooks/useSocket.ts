'use client';
// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket } from '@/lib/socket-client';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    setStatus(socket.connected ? 'connected' : 'connecting');

    const onConnect    = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onError      = () => setStatus('error');
    const onConnectErr = () => setStatus('error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('connect_error', onConnectErr);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('connect_error', onConnectErr);
    };
  }, []);

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  return { socket: socketRef.current, status, emit, on };
}
