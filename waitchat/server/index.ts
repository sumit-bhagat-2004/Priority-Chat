// server/index.ts — Standalone Socket.IO server (Render deployment)
import { createServer } from 'http';
import { Server } from 'socket.io';
import { store } from '../lib/store';
import { checkRateLimit } from '../lib/rateLimit';
import { sanitizeText } from '../lib/sanitize';

// Render assigns PORT dynamically; fall back to SOCKET_PORT or 3001
const PORT = parseInt(process.env.PORT ?? process.env.SOCKET_PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';
// SELF_URL is set in Render env to keep the service alive (must be THIS Render service URL)
const SELF_URL = process.env.SELF_URL ?? '';

// Build allowed CORS origins — include CLIENT_URL and common localhost combos
const allowedOrigins: (string | RegExp)[] = [
  CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  // Allow any Vercel preview/branch deploy for the project
  /^https:\/\/priority-chat.*\.vercel\.app$/,
];

const httpServer = createServer((req, res) => {
  // Health endpoint (used by KeepAlive + Vercel cron)
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// ── Online / typing state (ephemeral — OK to lose on restart) ────────────────
const onlineUsers = new Map<string, { userId: string; roomIds: Set<string> }>();
const typingUsers = new Map<string, Set<string>>();
// userId → socketId mapping for DM notifications
const userSocketMap = new Map<string, string>(); // userId → socket.id

// ── Socket handlers ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── Register user identity (called right after connect) ────────────────────
  socket.on('user:register', ({ userId }: { userId: string }) => {
    userSocketMap.set(userId, socket.id);
  });

  // ── Room Join ───────────────────────────────────────────────────────────────
  socket.on('room:join', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.join(roomId);
    await store.addMemberToRoom(roomId, userId);

    if (!onlineUsers.has(socket.id)) {
      onlineUsers.set(socket.id, { userId, roomIds: new Set() });
    }
    const userData = onlineUsers.get(socket.id)!;
    userData.roomIds.add(roomId);

    const user = await store.getUser(userId);
    if (user) {
      socket.to(roomId).emit('user:joined', { ...user, socketId: socket.id });
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

  // ── Room Leave ──────────────────────────────────────────────────────────────
  socket.on('room:leave', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    socket.leave(roomId);
    const userData = onlineUsers.get(socket.id);
    if (userData) userData.roomIds.delete(roomId);

    const typing = typingUsers.get(roomId);
    if (typing) {
      typing.delete(userId);
      io.to(roomId).emit('typing:update', { userId, active: false });
    }

    const user = await store.getUser(userId);
    if (user) socket.to(roomId).emit('user:left', user);
  });

  // ── Message Send ────────────────────────────────────────────────────────────
  socket.on('message:send', async ({ roomId, userId, content, tempId }: {
    roomId: string; userId: string; content: string; tempId: string;
  }) => {
    const rl = checkRateLimit(`msg:${userId}`, 30, 60 * 1000);
    if (!rl.allowed) {
      socket.emit('error', { code: 429, message: 'Too many messages. Please slow down.' });
      return;
    }

    const sanitized = sanitizeText(content, 2000);
    if (!sanitized) return;

    const msg = await store.addMessage(roomId, userId, sanitized);
    if (msg) {
      io.to(roomId).emit('message:new', { ...msg, tempId });
    }
  });

  // ── Typing Start ────────────────────────────────────────────────────────────
  socket.on('typing:start', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
    typingUsers.get(roomId)!.add(userId);
    const user = await store.getUser(userId);
    socket.to(roomId).emit('typing:update', { userId, name: user?.name, active: true });
  });

  // ── Typing Stop ─────────────────────────────────────────────────────────────
  socket.on('typing:stop', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    typingUsers.get(roomId)?.delete(userId);
    const user = await store.getUser(userId);
    socket.to(roomId).emit('typing:update', { userId, name: user?.name, active: false });
  });

  // ── Reaction ────────────────────────────────────────────────────────────────
  socket.on('reaction:add', async ({ messageId, roomId, emoji, userId }: {
    messageId: string; roomId: string; emoji: string; userId: string;
  }) => {
    const msg = await store.addReaction(messageId, roomId, emoji, userId);
    if (msg) {
      io.to(roomId).emit('reaction:update', { messageId, reactions: msg.reactions });
    }
  });

  // ── Heartbeat ───────────────────────────────────────────────────────────────
  socket.on('ping', () => socket.emit('pong'));

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      const { userId, roomIds } = userData;
      for (const roomId of roomIds) {
        typingUsers.get(roomId)?.delete(userId);
        io.to(roomId).emit('typing:update', { userId, active: false });
        const user = await store.getUser(userId);
        if (user) io.to(roomId).emit('user:left', user);
      }
      onlineUsers.delete(socket.id);
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[WaitChat Socket.IO] Running on port ${PORT}`);
  console.log(`[WaitChat Socket.IO] Accepting connections from ${CLIENT_URL}`);
  console.log(`[WaitChat Socket.IO] CORS allowed origins:`, allowedOrigins);
  startKeepAlive();
});

// ── Self-Ping Keep-Alive (prevents Render free-tier 15-min idle shutdown) ────
function startKeepAlive() {
  if (!SELF_URL) {
    console.log('[KeepAlive] SELF_URL not set — self-ping disabled (OK for local dev)');
    return;
  }

  // Validate SELF_URL points to this server (not the frontend)
  const selfPingUrl = `${SELF_URL}/health`;
  console.log(`[KeepAlive] Self-ping enabled → ${selfPingUrl} every 10 minutes`);

  const ping = () => {
    fetch(selfPingUrl, { signal: AbortSignal.timeout(10_000) })
      .then(r => r.ok
        ? console.log(`[KeepAlive] Ping OK (${new Date().toLocaleTimeString()}) status=${r.status}`)
        : console.warn(`[KeepAlive] Ping returned ${r.status} — check SELF_URL env var`)
      )
      .catch(err => console.warn('[KeepAlive] Ping failed:', err.message));
  };

  setTimeout(ping, 5_000);               // first ping 5s after startup
  setInterval(ping, 10 * 60 * 1000);     // then every 10 minutes
}

export {};
