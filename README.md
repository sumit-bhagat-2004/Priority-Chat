# WaitChat 💬

> *The chat that holds your world until you're ready.*

WaitChat is a real-time group messaging app with one radical rule: **messages are held from your view while you're typing — anywhere, in any tab.** The moment you stop typing, everything floods back in sequence.

## ✨ The Core Mechanic

- **Hold while typing:** All incoming messages (including your own sent ones) are queued while you type
- **4-layer detection:** Current tab → BroadcastChannel cross-tab → window blur/focus → OS heuristic
- **Stagger flush:** When you stop typing, queued messages appear one by one with a 120ms stagger
- **HoldBadge:** Floating "N messages waiting..." badge with a manual "Show" button

## 🎨 Design

Silver · Gold · Black palette with automatic Day/Night theme switching based on system time (06:00–18:00 light, 18:00–06:00 dark).

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd waitchat
bun install
```

### 2. Start the Socket.IO server (Terminal 1)

```bash
bun run dev:socket
```

### 3. Start the Next.js app (Terminal 2)

```bash
bun run dev
```

Or run both together:

```bash
bun run dev:all
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
waitchat/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing / username entry
│   ├── room/[roomId]/      # Chat room
│   └── api/                # REST API routes
├── components/
│   ├── layout/             # Header, Sidebar
│   └── chat/               # MessageList, MessageInput, HoldBadge, etc.
├── hooks/
│   ├── useTypingDetector.ts # 4-layer typing detection
│   ├── useMessageQueue.ts   # Hold mechanic + stagger flush
│   ├── useSocket.ts         # Socket.IO client hook
│   └── useTheme.ts          # Time-based theme switching
├── lib/
│   ├── store.ts            # In-memory data store (Redis-ready)
│   ├── theme.ts            # Theme engine
│   └── socket-client.ts    # Socket.IO singleton
└── server/
    └── index.ts            # Standalone Socket.IO server
```

## 🔧 Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001   # Local dev
# NEXT_PUBLIC_SOCKET_URL=https://your-server.railway.app  # Production
```

## 🚢 Deployment

**Frontend:** Deploy `waitchat/` to [Vercel](https://vercel.com)  
**Socket Server:** Deploy `waitchat/server/` to [Railway](https://railway.app) or [Fly.io](https://fly.io)

Set `NEXT_PUBLIC_SOCKET_URL` in Vercel dashboard to your Railway URL.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, React 19) |
| Runtime | Bun 1.3 |
| Language | TypeScript (strict) |
| Styling | Vanilla CSS with CSS Variables |
| Real-time | Socket.IO v4 |
| State | React hooks + Context |
| Fonts | Instrument Serif + Inter (Google Fonts) |

---

*WaitChat — Hackathon Edition · Built with ❤️ by Sumit Bhagat*
