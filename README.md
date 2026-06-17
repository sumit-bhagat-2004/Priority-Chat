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

## 🚢 Production Deployment

WaitChat is split into two components for production deployment:
1. **Next.js Frontend**: Deployed on **Vercel** (Serverless/Edge).
2. **Socket.IO Server**: Deployed on **Render** (Web Service).
3. **Database**: **Upstash Redis** (REST connection) for persistent rooms, users, and message history.

---

### Step 1: Set Up Upstash Redis
1. Sign in to your [Upstash Console](https://console.upstash.com).
2. Create a new **Redis Database** (free tier is sufficient).
3. Copy your `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the database details dashboard.

---

### Step 2: Deploy Socket.IO Server to Render
1. Go to [Render](https://render.com) and sign in.
2. Click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following options:
   - **Name**: `waitchat-socket`
   - **Environment**: `Node` (or leave default, Render will detect Bun/Node)
   - **Root Directory**: `waitchat`
   - **Build Command**: `bun install`
   - **Start Command**: `bun run server/index.ts`
5. Click **Advanced** and add the following **Environment Variables**:
   - `UPSTASH_REDIS_REST_URL`: *Your Upstash Redis REST URL*
   - `UPSTASH_REDIS_REST_TOKEN`: *Your Upstash Redis REST Token*
   - `CLIENT_URL`: `https://your-app.vercel.app` (You can update this after Vercel deployment)
   - `SELF_URL`: `https://your-socket-service.onrender.com` (Your Render Web Service URL)
6. Click **Create Web Service**. Wait for the build and deployment to complete, then copy the generated **Render URL** (e.g., `https://waitchat-socket.onrender.com`).

---

### Step 3: Deploy Next.js Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Set the following options:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `waitchat` (Click "Edit" and choose `waitchat`)
   - **Build Command**: `bun run build`
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_SOCKET_URL`: *Your Render URL* (e.g., `https://waitchat-socket.onrender.com`)
   - `UPSTASH_REDIS_REST_URL`: *Your Upstash Redis REST URL*
   - `UPSTASH_REDIS_REST_TOKEN`: *Your Upstash Redis REST Token*
5. Click **Deploy**. Vercel will automatically configure and run the cron job specified in `vercel.json` to trigger keep-alive pings to the Render server.
6. Once deployed, note down your production Vercel URL (e.g., `https://waitchat.vercel.app`).

---

### Step 4: Finalize Environment Connections
1. Go back to your Render dashboard for the `waitchat-socket` service.
2. Under **Environment**, update the `CLIENT_URL` to match your Vercel URL (e.g., `https://your-app.vercel.app`).
3. Under **Environment**, update the `SELF_URL` to match your Render service URL (e.g., `https://your-socket-service.onrender.com`).
4. Save the environment variables. Render will automatically redeploy with the updated config.

Your deployment is complete! The Vercel cron and Render self-pings will keep the Socket.IO server awake, ensuring real-time messages are always active.


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
