// lib/store.ts — Async store: Upstash Redis backend with in-memory fallback
// NOTE: @upstash/redis auto-serializes/deserializes JSON — do NOT use JSON.stringify/parse with it.
import { nanoid } from 'nanoid';

export interface User {
  id: string;
  name: string;
  color: string;
  joinedAt: string;
}

export interface Room {
  id: string;
  name: string;
  createdAt: string;
  memberIds: string[];
  isGroup: boolean;
  createdBy: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  timestamp: string;
  reactions: Record<string, string[]>; // emoji → userIds
  edited?: boolean;
}

// ─── Avatar palette (gold/silver tones) ───────────────────────────────────────
const AVATAR_COLORS = [
  '#D4AF37', '#C0C0C0', '#B8962E', '#A8A8A8',
  '#9A7820', '#808080', '#E8C84A', '#D0D0D0',
  '#6B5A1E', '#606060', '#F0D060', '#E0E0E0',
];
function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ─── Redis key helpers ────────────────────────────────────────────────────────
const K = {
  user:     (id: string)    => `wc:user:${id}`,
  userName: (name: string)  => `wc:user:name:${name.toLowerCase()}`,
  session:  (token: string) => `wc:session:${token}`,
  room:     (id: string)    => `wc:room:${id}`,
  rooms:                       'wc:rooms',
  messages: (roomId: string)=> `wc:msgs:${roomId}`,
};

// Deterministic DM room ID — sorted so Alice→Bob and Bob→Alice share the same room
function dmRoomId(userIdA: string, userIdB: string): string {
  return `dm:${[userIdA, userIdB].sort().join(':')}`;
}

// ─── Upstash Redis client (lazy singleton) ────────────────────────────────────
type RedisClient = import('@upstash/redis').Redis;
let _redis: RedisClient | null = null;
let _redisChecked = false;

function getRedis(): RedisClient | null {
  if (_redisChecked) return _redis;
  _redisChecked = true;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[store] UPSTASH env vars not set — using in-memory fallback');
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis');
  _redis = new Redis({ url, token });
  console.log('[store] Upstash Redis connected');
  return _redis;
}

// ─── In-Memory Fallback ───────────────────────────────────────────────────────
const memUsers    = new Map<string, User>();
const memRooms    = new Map<string, Room>();
const memMessages = new Map<string, Message[]>();
const memSessions = new Map<string, string>(); // token → userId

// Seed the general room in-memory
const GENERAL_ROOM_ID = 'general';
memRooms.set(GENERAL_ROOM_ID, {
  id: GENERAL_ROOM_ID, name: 'General',
  createdAt: new Date().toISOString(),
  memberIds: [], isGroup: true, createdBy: 'system',
});
memMessages.set(GENERAL_ROOM_ID, []);

// ─── Ensure the general room exists in Redis ──────────────────────────────────
async function ensureGeneralRoom() {
  const r = getRedis();
  if (!r) return;
  const exists = await r.exists(K.room(GENERAL_ROOM_ID));
  if (!exists) {
    const room: Room = {
      id: GENERAL_ROOM_ID, name: 'General',
      createdAt: new Date().toISOString(),
      memberIds: [], isGroup: true, createdBy: 'system',
    };
    // @upstash/redis serializes objects automatically — no JSON.stringify needed
    await r.set(K.room(GENERAL_ROOM_ID), room);
    await r.sadd(K.rooms, GENERAL_ROOM_ID);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = {

  // ── Users ───────────────────────────────────────────────────────────────────

  async createUser(name: string): Promise<User> {
    const user: User = {
      id: nanoid(), name, color: randomColor(), joinedAt: new Date().toISOString(),
    };
    const r = getRedis();
    if (r) {
      await Promise.all([
        r.set(K.user(user.id), user),          // SDK auto-serializes object
        r.set(K.userName(user.name), user.id), // plain string
      ]);
    } else {
      memUsers.set(user.id, user);
    }
    return user;
  },

  async getUser(id: string): Promise<User | undefined> {
    const r = getRedis();
    if (r) {
      const user = await r.get<User>(K.user(id)); // SDK auto-deserializes
      return user ?? undefined;
    }
    return memUsers.get(id);
  },

  async getUserByName(name: string): Promise<User | undefined> {
    const r = getRedis();
    if (r) {
      const userId = await r.get<string>(K.userName(name));
      if (!userId) return undefined;
      const user = await r.get<User>(K.user(userId));
      return user ?? undefined;
    }
    for (const user of memUsers.values()) {
      if (user.name.toLowerCase() === name.toLowerCase()) return user;
    }
    return undefined;
  },

  // ── Sessions ─────────────────────────────────────────────────────────────────

  async createSession(userId: string): Promise<string> {
    const token = nanoid(32);
    const r = getRedis();
    if (r) {
      await r.set(K.session(token), userId, { ex: 86400 }); // 24h TTL
    } else {
      memSessions.set(token, userId);
    }
    return token;
  },

  async getUserIdFromSession(token: string): Promise<string | undefined> {
    const r = getRedis();
    if (r) {
      const uid = await r.get<string>(K.session(token));
      return uid ?? undefined;
    }
    return memSessions.get(token);
  },

  // ── Rooms ────────────────────────────────────────────────────────────────────

  async createRoom(name: string, createdBy: string, isGroup = true): Promise<Room> {
    const room: Room = {
      id: nanoid(), name, createdAt: new Date().toISOString(),
      memberIds: [createdBy], isGroup, createdBy,
    };
    const r = getRedis();
    if (r) {
      await r.set(K.room(room.id), room); // SDK auto-serializes
      await r.sadd(K.rooms, room.id);
    } else {
      memRooms.set(room.id, room);
      memMessages.set(room.id, []);
    }
    return room;
  },

  async getRoom(id: string): Promise<Room | undefined> {
    if (id === GENERAL_ROOM_ID) await ensureGeneralRoom();
    const r = getRedis();
    if (r) {
      const room = await r.get<Room>(K.room(id));
      return room ?? undefined;
    }
    return memRooms.get(id);
  },

  async getAllRooms(): Promise<Room[]> {
    await ensureGeneralRoom();
    const r = getRedis();
    if (r) {
      const ids = await r.smembers(K.rooms) as string[];
      if (ids.length === 0) return [];
      const rooms = await Promise.all(ids.map(id => r.get<Room>(K.room(id))));
      return rooms.filter((rm): rm is Room => rm !== null && rm !== undefined);
    }
    return Array.from(memRooms.values());
  },

  async addMemberToRoom(roomId: string, userId: string): Promise<void> {
    const r = getRedis();
    if (r) {
      const room = await r.get<Room>(K.room(roomId));
      if (!room) return;
      if (!room.memberIds.includes(userId)) {
        room.memberIds.push(userId);
        await r.set(K.room(roomId), room);
      }
    } else {
      const room = memRooms.get(roomId);
      if (room && !room.memberIds.includes(userId)) {
        room.memberIds.push(userId);
      }
    }
  },

  // ── DM Rooms ─────────────────────────────────────────────────────────────────

  async getOrCreateDmRoom(userIdA: string, userIdB: string): Promise<Room> {
    const id = dmRoomId(userIdA, userIdB);
    const existing = await this.getRoom(id);
    if (existing) return existing;

    const userA = await this.getUser(userIdA);
    const userB = await this.getUser(userIdB);
    const room: Room = {
      id,
      name: `${userA?.name ?? userIdA} & ${userB?.name ?? userIdB}`,
      createdAt: new Date().toISOString(),
      memberIds: [userIdA, userIdB],
      isGroup: false,
      createdBy: userIdA,
    };

    const r = getRedis();
    if (r) {
      await r.set(K.room(id), room);
      await r.sadd(K.rooms, id);
    } else {
      memRooms.set(id, room);
      memMessages.set(id, []);
    }
    return room;
  },

  // ── Messages ─────────────────────────────────────────────────────────────────

  async addMessage(roomId: string, senderId: string, content: string): Promise<Message | null> {
    const user = await this.getUser(senderId);
    if (!user) return null;
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const msg: Message = {
      id: nanoid(), roomId, senderId,
      senderName: user.name, senderColor: user.color,
      content, timestamp: new Date().toISOString(), reactions: {},
    };

    const r = getRedis();
    if (r) {
      // Store serialized JSON string in a Redis list so lrange returns strings
      await r.rpush(K.messages(roomId), JSON.stringify(msg));
      await r.ltrim(K.messages(roomId), -500, -1); // keep last 500
    } else {
      const list = memMessages.get(roomId) ?? [];
      list.push(msg);
      memMessages.set(roomId, list);
    }

    await this.addMemberToRoom(roomId, senderId);
    return msg;
  },

  async getMessages(roomId: string, limit = 50, before?: string): Promise<Message[]> {
    const r = getRedis();
    if (r) {
      const raws = await r.lrange(K.messages(roomId), -limit, -1) as (string | Message)[];
      const msgs: Message[] = raws.map(raw =>
        typeof raw === 'string' ? JSON.parse(raw) as Message : raw as Message
      );
      if (!before) return msgs;
      const idx = msgs.findIndex(m => m.id === before);
      if (idx <= 0) return [];
      return msgs.slice(Math.max(0, idx - limit), idx);
    }
    const list = memMessages.get(roomId) ?? [];
    if (!before) return list.slice(-limit);
    const idx = list.findIndex(m => m.id === before);
    if (idx <= 0) return [];
    return list.slice(Math.max(0, idx - limit), idx);
  },

  async addReaction(messageId: string, roomId: string, emoji: string, userId: string): Promise<Message | null> {
    const r = getRedis();
    if (r) {
      const raws = await r.lrange(K.messages(roomId), 0, -1) as (string | Message)[];
      const msgs: Message[] = raws.map(raw =>
        typeof raw === 'string' ? JSON.parse(raw) as Message : raw as Message
      );
      const idx = msgs.findIndex(m => m.id === messageId);
      if (idx === -1) return null;
      const msg = msgs[idx];
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      const ui = msg.reactions[emoji].indexOf(userId);
      if (ui === -1) {
        msg.reactions[emoji].push(userId);
      } else {
        msg.reactions[emoji].splice(ui, 1);
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
      }
      await r.lset(K.messages(roomId), idx, JSON.stringify(msg));
      return msg;
    }
    // In-memory fallback
    const list = memMessages.get(roomId);
    if (!list) return null;
    const msg = list.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const ui = msg.reactions[emoji].indexOf(userId);
    if (ui === -1) {
      msg.reactions[emoji].push(userId);
    } else {
      msg.reactions[emoji].splice(ui, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    return msg;
  },
};
