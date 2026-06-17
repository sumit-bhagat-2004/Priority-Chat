// lib/store.ts - In-memory store (Redis-ready interface)
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

// Avatar colors palette (gold/silver tones)
const AVATAR_COLORS = [
  '#D4AF37', '#C0C0C0', '#B8962E', '#A8A8A8',
  '#9A7820', '#808080', '#E8C84A', '#D0D0D0',
  '#6B5A1E', '#606060', '#F0D060', '#E0E0E0',
];

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// ─── In-Memory Store ───
const users = new Map<string, User>();
const rooms = new Map<string, Room>();
const messages = new Map<string, Message[]>(); // roomId → messages[]
const sessions = new Map<string, string>(); // sessionToken → userId

// Seed a general room
const GENERAL_ROOM_ID = 'general';
rooms.set(GENERAL_ROOM_ID, {
  id: GENERAL_ROOM_ID,
  name: 'General',
  createdAt: new Date().toISOString(),
  memberIds: [],
  isGroup: true,
  createdBy: 'system',
});
messages.set(GENERAL_ROOM_ID, []);

export const store = {
  // ─── Users ───
  createUser(name: string): User {
    const user: User = {
      id: nanoid(),
      name,
      color: randomColor(),
      joinedAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    return user;
  },

  getUser(id: string): User | undefined {
    return users.get(id);
  },

  getUserByName(name: string): User | undefined {
    for (const user of users.values()) {
      if (user.name.toLowerCase() === name.toLowerCase()) return user;
    }
    return undefined;
  },

  // ─── Sessions ───
  createSession(userId: string): string {
    const token = nanoid(32);
    sessions.set(token, userId);
    return token;
  },

  getUserIdFromSession(token: string): string | undefined {
    return sessions.get(token);
  },

  // ─── Rooms ───
  createRoom(name: string, createdBy: string, isGroup = true): Room {
    const room: Room = {
      id: nanoid(),
      name,
      createdAt: new Date().toISOString(),
      memberIds: [createdBy],
      isGroup,
      createdBy,
    };
    rooms.set(room.id, room);
    messages.set(room.id, []);
    return room;
  },

  getRoom(id: string): Room | undefined {
    return rooms.get(id);
  },

  getAllRooms(): Room[] {
    return Array.from(rooms.values());
  },

  addMemberToRoom(roomId: string, userId: string): void {
    const room = rooms.get(roomId);
    if (room && !room.memberIds.includes(userId)) {
      room.memberIds.push(userId);
    }
  },

  // ─── Messages ───
  addMessage(roomId: string, senderId: string, content: string): Message | null {
    const user = users.get(senderId);
    if (!user) return null;
    const room = rooms.get(roomId);
    if (!room) return null;

    const msg: Message = {
      id: nanoid(),
      roomId,
      senderId,
      senderName: user.name,
      senderColor: user.color,
      content,
      timestamp: new Date().toISOString(),
      reactions: {},
    };

    const roomMessages = messages.get(roomId) ?? [];
    roomMessages.push(msg);
    messages.set(roomId, roomMessages);

    // Ensure member
    this.addMemberToRoom(roomId, senderId);

    return msg;
  },

  getMessages(roomId: string, limit = 50, before?: string): Message[] {
    const roomMessages = messages.get(roomId) ?? [];
    if (!before) {
      return roomMessages.slice(-limit);
    }
    const idx = roomMessages.findIndex(m => m.id === before);
    if (idx <= 0) return [];
    return roomMessages.slice(Math.max(0, idx - limit), idx);
  },

  addReaction(messageId: string, roomId: string, emoji: string, userId: string): Message | null {
    const roomMessages = messages.get(roomId);
    if (!roomMessages) return null;
    const msg = roomMessages.find(m => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx === -1) {
      msg.reactions[emoji].push(userId);
    } else {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    return msg;
  },
};
