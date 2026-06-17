// server/index.ts - Standalone Socket.IO server
import { createServer } from 'http';
import { Server } from 'socket.io';
import { store } from '../lib/store';

const PORT = parseInt(process.env.SOCKET_PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Track online users: socketId → { userId, roomId }
const onlineUsers = new Map<string, { userId: string; roomIds: Set<string> }>();
// Track typing: roomId → Set<userId>
const typingUsers = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── Room Join ───
  socket.on('room:join', ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.join(roomId);
    store.addMemberToRoom(roomId, userId);

    // Track online
    if (!onlineUsers.has(socket.id)) {
      onlineUsers.set(socket.id, { userId, roomIds: new Set() });
    }
    const userData = onlineUsers.get(socket.id)!;
    userData.roomIds.add(roomId);

    const user = store.getUser(userId);
    if (user) {
      socket.to(roomId).emit('user:joined', { ...user, socketId: socket.id });
      // Send presence list to the joining user
      const presentUsers: string[] = [];
      for (const [, data] of onlineUsers) {
        if (data.roomIds.has(roomId) && data.userId !== userId) {
          presentUsers.push(data.userId);
        }
      }
      socket.emit('user:presence', { onlineUserIds: presentUsers });
    }

    console.log(`[Socket] ${userId} joined room ${roomId}`);
  });

  // ─── Room Leave ───
  socket.on('room:leave', ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.leave(roomId);
    const userData = onlineUsers.get(socket.id);
    if (userData) userData.roomIds.delete(roomId);

    // Stop typing
    const typing = typingUsers.get(roomId);
    if (typing) {
      typing.delete(userId);
      io.to(roomId).emit('typing:update', { userId, active: false });
    }

    const user = store.getUser(userId);
    if (user) socket.to(roomId).emit('user:left', user);
  });

  // ─── Message Send ───
  socket.on('message:send', ({ roomId, userId, content, tempId }: {
    roomId: string; userId: string; content: string; tempId: string;
  }) => {
    const msg = store.addMessage(roomId, userId, content.trim());
    if (msg) {
      io.to(roomId).emit('message:new', { ...msg, tempId });
    }
  });

  // ─── Typing Start ───
  socket.on('typing:start', ({ roomId, userId }: { roomId: string; userId: string }) => {
    if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
    typingUsers.get(roomId)!.add(userId);
    const user = store.getUser(userId);
    socket.to(roomId).emit('typing:update', { userId, name: user?.name, active: true });
  });

  // ─── Typing Stop ───
  socket.on('typing:stop', ({ roomId, userId }: { roomId: string; userId: string }) => {
    typingUsers.get(roomId)?.delete(userId);
    const user = store.getUser(userId);
    socket.to(roomId).emit('typing:update', { userId, name: user?.name, active: false });
  });

  // ─── Reaction ───
  socket.on('reaction:add', ({ messageId, roomId, emoji, userId }: {
    messageId: string; roomId: string; emoji: string; userId: string;
  }) => {
    const msg = store.addReaction(messageId, roomId, emoji, userId);
    if (msg) {
      io.to(roomId).emit('reaction:update', { messageId, reactions: msg.reactions });
    }
  });

  // ─── Heartbeat ───
  socket.on('ping', () => socket.emit('pong'));

  // ─── Disconnect ───
  socket.on('disconnect', () => {
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      const { userId, roomIds } = userData;
      for (const roomId of roomIds) {
        // Stop typing
        typingUsers.get(roomId)?.delete(userId);
        io.to(roomId).emit('typing:update', { userId, active: false });

        // Notify room
        const user = store.getUser(userId);
        if (user) io.to(roomId).emit('user:left', user);
      }
      onlineUsers.delete(socket.id);
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[WaitChat Socket.IO] Running on port ${PORT}`);
  console.log(`[WaitChat Socket.IO] Accepting connections from ${CLIENT_URL}`);
});

export {};
