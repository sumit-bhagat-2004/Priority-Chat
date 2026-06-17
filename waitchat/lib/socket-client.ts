// lib/socket-client.ts - Singleton Socket.IO client
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
    socket = io(SOCKET_URL, {
      // Start with polling (works behind any proxy), then upgrade to WebSocket
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 20000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
