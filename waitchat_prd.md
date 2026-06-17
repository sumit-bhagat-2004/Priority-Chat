# WaitChat — Product Requirements Document

> **App Name:** WaitChat  
> **Stack:** Next.js 14+ (App Router) · Bun runtime · Socket.IO / WebSockets · Vercel Deployment  
> **Tagline:** *The chat that holds your world until you're ready.*

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Core Mechanic — The Typing Hold](#2-core-mechanic--the-typing-hold)
3. [Judging Criteria Alignment](#3-judging-criteria-alignment)
4. [Design System & Theme](#4-design-system--theme)
5. [Architecture Overview](#5-architecture-overview)
6. [Feature Specification](#6-feature-specification)
7. [Phase 1 PRD — Foundation](#phase-1-prd--foundation)
8. [Phase 2 PRD — Core Chat Mechanic](#phase-2-prd--core-chat-mechanic)
9. [Phase 3 PRD — Typing Detection (All Tabs/OS)](#phase-3-prd--typing-detection-all-tabsos)
10. [Phase 4 PRD — Polish, PWA & Day/Night Theme](#phase-4-prd--polish-pwa--daynight-theme)
11. [Phase 5 PRD — Final Deployment & Hardening](#phase-5-prd--final-deployment--hardening)
12. [Test Cases — All Phases](#test-cases--all-phases)
13. [Non-Functional Requirements](#non-functional-requirements)
14. [API Contracts](#api-contracts)
15. [Known Constraints & Edge Cases](#known-constraints--edge-cases)

---

## 1. Executive Overview

WaitChat is a real-time group messaging web application with one radical rule: **messages sent by anyone are held back from your view until you stop typing — everywhere, in any tab, in any browser window.** The hold is intentional, perceptual, and relentless.

This is not lag. This is design.

When you stop typing, everything that accumulated — your own sent messages included — floods back in sequence, as if the world had been pausing politely while you composed your thoughts.

### Why This Is Interesting

Standard chat tools optimize for the sender's gratification (instant delivery). WaitChat optimizes for the *recipient's cognitive focus*. The mechanic forces a natural rhythm: compose → send → rest → receive. It mirrors how great conversations actually feel — like turns, not interruptions.

### Ruthless Typing Detection

The spec demands that typing detection is "ruthless" — it must detect typing:
- In the WaitChat tab itself
- In any other browser tab (same or different origin)
- In any other Chrome window
- In native OS applications (as much as the browser security model permits)

This is achieved using a layered approach:
1. **Primary:** `document.addEventListener('keydown')` with focus tracking
2. **Secondary:** `BroadcastChannel` API to sync typing state across same-origin tabs
3. **Tertiary (cross-origin/OS):** `visibilitychange` + `document.hasFocus()` polling + PWA background service worker signals + optional Screen Wake Lock API activity monitoring
4. **Fallback:** A configurable "typing idle timeout" (default: 1500ms) that resets hold state

---

## 2. Core Mechanic — The Typing Hold

### The Rule, Precisely

> If **you** are typing **anywhere** — in any input field, in any browser tab, in any window, in any native application that causes your browser to detect keystroke activity — then **every new incoming message** (including your own sent messages) is **queued on your client only** and not rendered to the message list.
>
> The moment your typing activity ceases (idle for ≥ 1500ms), the queue is flushed in chronological order and messages appear one by one with a brief stagger animation.

### Key Invariants

| # | Invariant | Description |
|---|-----------|-------------|
| I1 | Sender-equal treatment | A user who sends a message and immediately continues typing does NOT see their own message appear. It joins the queue alongside everyone else's. |
| I2 | Client-only hold | The hold exists on the viewer's client only. The message has already been delivered to the server and to all other clients. It is a display hold, not a transmission hold. |
| I3 | Ordering preserved | All queued messages flush in server-timestamp order, never scrambled. |
| I4 | Universal typing scope | Typing is detected beyond the current tab. Cross-tab via BroadcastChannel. Cross-app via focus/blur + keystroke inference. |
| I5 | No special users | Room owners, admins, and message senders are all subject to identical rules on their own screens. |
| I6 | Real-time for non-typists | Users who are not typing see messages appear in real time with no hold applied. |

### Typing Detection Layers

```
Layer 1 — Current Tab (Reliable, 0ms latency)
  └─ keydown events on document (any input, contenteditable, textarea, etc.)
  └─ input / compositionstart events for IME/mobile keyboards

Layer 2 — Same-Origin Other Tabs (Reliable, <50ms latency)
  └─ BroadcastChannel('waitchat-typing')
  └─ On keydown in Tab A → broadcast {userId, typing: true, ts}
  └─ Tab B receives → sets local typingState = true
  └─ BroadcastChannel idle message after 1500ms of no key events

Layer 3 — Cross-Origin / Other Windows (Best-effort)
  └─ visibilitychange: when tab loses visibility, check if focus moved to another window
  └─ window.blur → start 500ms poll: if no focus returns AND no typing in current tab,
     assume user is typing elsewhere if they had been typing < 5s ago
  └─ PWA: service worker can maintain typing state across reloads / background

Layer 4 — OS-Level Applications (Heuristic)
  └─ When document.hasFocus() === false AND user was recently typing,
     extend the typing hold by an additional "ghost typing window" of 3000ms
  └─ This is a heuristic — cannot read OS keyboard events by browser security design
  └─ User-configurable: "Extend hold when I switch apps" toggle in settings
```

### Message Queue Flush Behavior

```
User stops typing (all layers idle ≥ 1500ms)
  └─ Animate: "X messages waiting..." badge fades out
  └─ Stagger flush: messages appear every 120ms in timestamp order
  └─ Each message uses slide-in-from-bottom animation (60ms per message)
  └─ After last message: subtle "caught up" indicator (1s, then fades)
```

---

## 3. Judging Criteria Alignment

| Criterion | WaitChat Strategy |
|-----------|-------------------|
| **Creativity & Innovation** | The intentional message-hold mechanic is a genuinely novel interaction model with no direct precedent in mainstream chat. The ruthless cross-tab/OS typing detection elevates it further. |
| **Functionality & Responsiveness** | Full real-time messaging via WebSockets. Sub-200ms message delivery. PWA support with offline-aware states. |
| **Code Quality** | TypeScript end-to-end. Bun runtime for speed. Next.js App Router with server components. Zod schemas for all API contracts. ESLint + Prettier enforced. |
| **Deployment Success** | Vercel-native deployment with automatic preview branches per PR. WebSocket handled via Vercel's edge runtime or Railway/Render fallback for persistent socket. |
| **Visual Appeal & UX** | Auto day/night theme tied to system clock. Fluid typography. Stagger animations for queue flush. Polished empty states and skeleton loaders. |
| **Problem Solving** | Cross-tab typing detection using BroadcastChannel. OS-level inference via focus/blur heuristics. Configurable hold timeout. |
| **Unique from Generic AI** | No AI features. Deliberately human-paced. The inverse of autocomplete: WaitChat slows down, not speeds up, the flow of information. |

---

## 4. Design System & Theme

### Color Palette — "Midnight Ink"

WaitChat uses a dark-first palette inspired by late-night writing — ink, paper, and the warm glow of a desk lamp. The accent is a warm amber-gold that suggests the act of writing.

```
Primary Background (Dark):  #0f0e0c   (near-black warm)
Surface (Dark):             #1a1916   (warm charcoal)
Surface Elevated (Dark):    #222019   (elevated card)
Border (Dark):              #2e2c28   (subtle warm border)
Text Primary (Dark):        #e8e6e1   (warm off-white)
Text Muted (Dark):          #8a8780   (muted gray)
Accent Gold:                #d4a843   (warm amber — key CTAs, unread badges)
Accent Hover:               #c49330   (deeper amber)
Hold Indicator:             #7a5c1e   (dimmed gold — "messages waiting" state)

Primary Background (Light):  #faf8f4  (warm cream)
Surface (Light):             #f5f2ed  (paper white)
Surface Elevated (Light):    #ffffff
Border (Light):              #ddd9d3
Text Primary (Light):        #1a1916
Text Muted (Light):          #6b6862
Accent Gold (Light):         #b8882a  (adjusted for light contrast)
```

### Day / Night Automatic Switching

The theme switches automatically based on system time:
- **Day Mode:** 06:00–18:00 local time → light "paper" theme
- **Night Mode:** 18:00–06:00 local time → dark "ink" theme
- **Manual Override:** sun/moon toggle in header persists for session
- **System Preference Fallback:** `prefers-color-scheme` used if time-based logic is disabled

```typescript
// theme-engine.ts
export function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}
```

The theme is re-evaluated every 5 minutes and transitions smoothly with a 400ms CSS transition on `background-color` and `color`.

### Typography

- **Display font:** `Instrument Serif` (Google Fonts) — used for app name, room titles
- **Body font:** `Geist` (Vercel's own, via npm or CDN) — UI text, messages
- **Mono font:** `Geist Mono` — timestamps, user IDs, technical indicators

### Iconography

- Lucide Icons (via `lucide-react`) — consistent 24px stroke icons throughout

### Motion Design

- **Message arrival (no hold):** `translateY(8px) → 0, opacity 0 → 1` over 180ms ease-out
- **Queue flush (staggered):** Same animation × N messages, staggered by 120ms each
- **Hold badge appear:** Scale 0 → 1 with spring easing over 200ms
- **Theme transition:** 400ms on all color properties
- **Typing indicator (others):** Three-dot pulse animation, 600ms cycle

---

## 5. Architecture Overview

### Tech Stack

```
Frontend:          Next.js 14+ (App Router, React Server Components)
Runtime:           Bun (local dev + CI)
Language:          TypeScript (strict mode)
Styling:           Tailwind CSS v4 + CSS Variables
State:             Zustand (client-side) + React Query (server state)
Realtime:          Socket.IO (with WebSocket transport) or Ably/Pusher fallback
Auth:              NextAuth.js v5 (username-only, no password — demo mode)
Database:          Upstash Redis (Vercel KV) — message persistence
Deployment:        Vercel (frontend) + Railway/Fly.io (Socket.IO server, persistent)
PWA:               next-pwa (service worker, manifest, offline shell)
Testing:           Vitest + Playwright (E2E)
```

### Why Separate Socket Server?

Vercel's serverless functions are stateless and short-lived. Socket.IO requires persistent TCP connections. Solution: a minimal standalone Socket.IO server deployed on Railway/Fly.io (or using Ably/Pusher as a managed alternative). The Next.js app connects to this server's public URL via environment variable `NEXT_PUBLIC_SOCKET_URL`.

### Data Flow

```
User types in WaitChat tab
  ├─ Layer 1: keydown → set typingState=true, reset idleTimer
  └─ BroadcastChannel → notify all same-origin WaitChat tabs

User sends message
  └─ HTTP POST /api/messages → server validates, stores in Redis
  └─ Socket.IO server emits 'message:new' to all room members

Client receives 'message:new'
  ├─ IF typingState === false → render immediately
  └─ IF typingState === true  → push to messageQueue[]

User stops typing (idleTimer fires after 1500ms)
  └─ typingState = false
  └─ flushQueue() → stagger-render all queued messages
```

### Room Model

```typescript
interface Room {
  id: string;           // nanoid
  name: string;
  createdAt: Date;
  memberIds: string[];
  isGroup: boolean;     // true = group chat, false = private DM
}

interface Message {
  id: string;           // nanoid
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;      // server-assigned, canonical ordering
  edited?: boolean;
}

interface User {
  id: string;           // nanoid
  name: string;         // chosen on join, no password
  color: string;        // auto-assigned avatar color
  joinedAt: Date;
}
```

---

## 6. Feature Specification

### F1 — Authentication (Username Entry)

- Landing page with a single text field: "Choose a display name"
- No password, no email — demo-mode auth
- Name stored in session cookie (NextAuth session)
- Duplicate names allowed (distinguished by user ID in UI)

### F2 — Room Discovery & Creation

- Sidebar lists: Recent DMs, Group Rooms
- "New Group" button → name the room → share invite link
- "New DM" button → search for user by name
- URL structure: `/room/[roomId]`

### F3 — Group Chat

- Real-time message stream
- Typing indicators: "Alice is typing..." (for others, rendered via Socket.IO)
- Message timestamps (relative: "just now", "2m ago")
- Message delivery status: Sent → Delivered → Seen
- Inline emoji reactions (click to react)

### F4 — Private DM

- 1:1 conversation
- Same hold mechanic applies (if you're typing anywhere, their DMs to you are also held)
- Read receipts shown

### F5 — The Hold Mechanic (Core)

- `useTypingDetector` hook — encapsulates all 4 detection layers
- `useMessageQueue` hook — manages the queue, flush, and stagger render
- `HoldBadge` component — floating badge showing "N messages waiting..."
- `CaughtUpIndicator` — brief "you're all caught up" flash after flush

### F6 — Settings Panel

- Toggle: "Extend hold when switching apps" (Layer 4 heuristic)
- Slider: "Typing idle timeout" (500ms – 5000ms, default 1500ms)
- Toggle: "Show hold badge"
- Toggle: "Manual theme" (override day/night auto)
- Info panel: "Why are messages delayed?" with mechanic explanation

### F7 — PWA

- Installable on Android/iOS/Desktop
- Offline shell: shows last 50 messages from IndexedDB cache
- Push notifications for new messages (when app is in background)
- Service worker typing broadcast for cross-tab hold sync

### F8 — Notifications

- Browser push notification when new message arrives AND user is idle (not typing)
- If user IS typing, notification is held and shown as in-app badge after flush

---

## Phase 1 PRD — Foundation

**Goal:** Deployable skeleton. No chat functionality yet. Proves the stack works end-to-end on Vercel.

**Duration Estimate:** 1–2 days

### Deliverables

| ID | Item | Details |
|----|------|---------|
| P1-D1 | Next.js project initialized with Bun | `bun create next-app waitchat --typescript --tailwind --eslint --app` |
| P1-D2 | Vercel project linked | `vercel link`, preview URL working |
| P1-D3 | Design system CSS | CSS variables for Midnight Ink palette, fluid type scale, spacing tokens |
| P1-D4 | Day/Night theme engine | Time-based switching + manual toggle, persisted in JS variable |
| P1-D5 | App shell layout | Header, sidebar, main content area, responsive at 375px and 1280px |
| P1-D6 | Landing / username page | `/` route — username entry form, NextAuth session creation |
| P1-D7 | Font loading | Instrument Serif + Geist via Google Fonts / Vercel |
| P1-D8 | ESLint + Prettier + Husky | Pre-commit hooks enforced |
| P1-D9 | Vercel environment variables | `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SOCKET_URL` (placeholder) |
| P1-D10 | Health check endpoint | `GET /api/health` returns `{status: "ok", ts: Date}` |

### Phase 1 File Structure

```
waitchat/
├── app/
│   ├── layout.tsx              # Root layout with ThemeProvider
│   ├── page.tsx                # Landing / username entry
│   ├── room/
│   │   └── [roomId]/
│   │       └── page.tsx        # Chat room (stub)
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── health/route.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/
│       ├── ThemeToggle.tsx
│       └── Button.tsx
├── lib/
│   ├── theme.ts                # getTimeBasedTheme(), auto-switch logic
│   └── auth.ts                 # NextAuth config
├── styles/
│   ├── globals.css             # CSS variables, base reset
│   └── tokens.css              # Design tokens
├── public/
│   ├── manifest.json           # PWA manifest (stub)
│   └── icons/
├── bun.lockb
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── vercel.json
```

### Phase 1 Acceptance Criteria

- [ ] `bun dev` starts with no errors
- [ ] `bun run build` completes with no TypeScript errors
- [ ] Vercel preview deployment URL is accessible
- [ ] Theme switches correctly at 06:00 and 18:00 (can be tested by mocking hour)
- [ ] Manual toggle overrides auto theme for the session
- [ ] Username entry form validates non-empty, min 2 chars, max 24 chars
- [ ] Session is created on username submit
- [ ] `/api/health` returns 200 with valid JSON
- [ ] Lighthouse accessibility score ≥ 90 on landing page
- [ ] No console errors in production build

---

## Phase 2 PRD — Core Chat Mechanic

**Goal:** Full real-time messaging (without the hold mechanic). Two users can chat in real time.

**Duration Estimate:** 2–3 days

### Deliverables

| ID | Item | Details |
|----|------|---------|
| P2-D1 | Socket.IO server | Standalone server on Railway/Fly.io, `socket.io` v4 |
| P2-D2 | Room creation API | `POST /api/rooms` — creates room in Upstash Redis |
| P2-D3 | Message send API | `POST /api/messages` — validates, stores, emits via Socket.IO |
| P2-D4 | Message history API | `GET /api/rooms/[roomId]/messages?cursor=` — paginated |
| P2-D5 | Socket.IO client hook | `useSocket()` — connects, handles reconnect, exposes emit/on |
| P2-D6 | MessageList component | Renders messages, auto-scrolls to bottom, handles pagination |
| P2-D7 | MessageInput component | Textarea, send on Enter, Shift+Enter for newline |
| P2-D8 | Typing indicator | `socket.emit('typing:start'/'typing:stop')`, "X is typing..." display |
| P2-D9 | Room sidebar | Lists rooms, unread count badge, active room highlight |
| P2-D10 | User presence | Online/offline dot per user, updated via socket heartbeat |
| P2-D11 | Message timestamps | `date-fns` relative time, updates every 60s |
| P2-D12 | Emoji reactions | Click → react picker (emoji-mart) → `POST /api/messages/[id]/react` |

### Phase 2 Data Models

```typescript
// Redis keys
// room:{roomId}          → Room JSON
// room:{roomId}:messages → Sorted set (score = timestamp ms)
// user:{userId}          → User JSON
// room:{roomId}:members  → Set of userIds
// typing:{roomId}        → Hash {userId: lastTypingTs}
```

### Phase 2 Socket Events

```typescript
// Client → Server
socket.emit('room:join', { roomId: string, userId: string })
socket.emit('message:send', { roomId, content, tempId })
socket.emit('typing:start', { roomId, userId })
socket.emit('typing:stop', { roomId, userId })
socket.emit('reaction:add', { messageId, emoji, userId })

// Server → Client
socket.on('message:new', (msg: Message) => void)
socket.on('typing:update', ({ userId, name, active }: TypingState) => void)
socket.on('user:joined', (user: User) => void)
socket.on('user:left', (user: User) => void)
socket.on('reaction:update', ({ messageId, reactions }) => void)
```

### Phase 2 Acceptance Criteria

- [ ] Two browser windows can join the same room and exchange messages
- [ ] Messages appear in both windows within 500ms of send
- [ ] Message history loads on room join (last 50 messages)
- [ ] Infinite scroll loads older messages when scrolled to top
- [ ] Typing indicator shows for the other user but NOT for yourself
- [ ] Typing indicator disappears within 2s of stopping
- [ ] User presence dot updates within 5s of disconnect
- [ ] Emoji reactions update in real time for all room members
- [ ] Socket reconnects automatically after network interruption
- [ ] All API routes return proper error codes (400, 401, 404, 500)

---

## Phase 3 PRD — Typing Detection (All Tabs/OS)

**Goal:** Implement the core "hold" mechanic with ruthless cross-tab and cross-app typing detection.

**Duration Estimate:** 2–3 days

### Deliverables

| ID | Item | Details |
|----|------|---------|
| P3-D1 | `useTypingDetector` hook | All 4 detection layers, returns `isTyping: boolean` |
| P3-D2 | Layer 1: Current tab detection | `keydown`, `input`, `compositionstart` event listeners |
| P3-D3 | Layer 2: BroadcastChannel sync | `new BroadcastChannel('waitchat-typing')`, cross-tab state |
| P3-D4 | Layer 3: Cross-window inference | `blur`/`focus` events + 3000ms ghost window |
| P3-D5 | Layer 4: OS heuristic | `hasFocus()` polling + configurable ghost extension |
| P3-D6 | `useMessageQueue` hook | Queue buffer, flush trigger, stagger renderer |
| P3-D7 | `HoldBadge` component | Floating count badge: "3 messages waiting..." |
| P3-D8 | Queue flush animation | Stagger slide-in, 120ms between messages |
| P3-D9 | `CaughtUpIndicator` | "You're all caught up ✓" flash after flush |
| P3-D10 | Settings integration | Idle timeout slider, ghost extension toggle, hold badge toggle |
| P3-D11 | Sender self-hold | Verify sent message joins queue if user continues typing |
| P3-D12 | Idle timeout configurability | 500ms–5000ms via settings slider |

### `useTypingDetector` Hook Specification

```typescript
interface TypingDetectorConfig {
  idleTimeout: number;       // ms, default 1500
  ghostWindowMs: number;     // ms after blur, default 3000
  enableOSHeuristic: boolean; // Layer 4, default true
}

interface TypingDetectorReturn {
  isTyping: boolean;
  lastTypedAt: number | null;   // Unix ms
  source: 'current-tab' | 'broadcast' | 'window-blur' | 'os-heuristic' | null;
}

function useTypingDetector(config?: Partial<TypingDetectorConfig>): TypingDetectorReturn
```

### `useMessageQueue` Hook Specification

```typescript
interface MessageQueueReturn {
  visibleMessages: Message[];      // Already rendered to screen
  queuedCount: number;             // Held back, not yet shown
  isHolding: boolean;              // True when isTyping === true AND queuedCount > 0
  flushNow: () => void;            // Manual flush (for accessibility / settings)
}

function useMessageQueue(
  allMessages: Message[],
  isTyping: boolean
): MessageQueueReturn
```

### BroadcastChannel Protocol

```typescript
interface TypingBroadcast {
  type: 'typing:active' | 'typing:idle';
  userId: string;
  ts: number;         // Unix ms, for staleness detection
  tabId: string;      // Random ID generated per tab load
}

// Rules:
// - On ANY keydown in any WaitChat tab: broadcast typing:active
// - After 1500ms idle in that tab: broadcast typing:idle
// - Receiver: set local typingState=true on 'active', false on 'idle'
// - Receiver ignores messages older than 5s (stale tab protection)
```

### OS Heuristic Logic

```typescript
// When document loses focus (window.blur or visibilitychange):
// IF last typed < 5s ago:
//   Set isTyping = true for ghostWindowMs (default 3000ms)
//   This covers: switching to another browser tab, switching to a desktop app
//   After ghost window expires: check focus restoration
//     IF focus returned within ghost window: resume normal detection
//     IF focus NOT returned: set isTyping = false (user is idle in other app)

// Limitation: Cannot read OS keystrokes. This is a deliberate heuristic.
// The spec says "ruthless" — we extend reasonable doubt to OS-level activity.
```

### Phase 3 Acceptance Criteria

- [ ] Typing in the current WaitChat tab holds all incoming messages
- [ ] Opening a second WaitChat tab and typing there holds messages in the first tab
- [ ] Opening a third, completely different tab (e.g., Google.com) and typing there holds messages (via blur heuristic)
- [ ] Switching to a native OS app (e.g., VS Code) and typing holds messages for the ghost window duration (3000ms by default)
- [ ] Messages queue in chronological order (server timestamp)
- [ ] After idle timeout, ALL queued messages flush with stagger animation
- [ ] A sent message that is immediately followed by typing is held on the sender's screen
- [ ] HoldBadge shows correct count
- [ ] CaughtUpIndicator appears after flush
- [ ] Changing idle timeout in settings takes effect immediately
- [ ] Disabling OS heuristic in settings removes Layer 4 detection
- [ ] Manual flush button in settings panel works
- [ ] BroadcastChannel cleanup on tab close (no memory leaks)

---

## Phase 4 PRD — Polish, PWA & Day/Night Theme

**Goal:** Production-grade UX polish, PWA installability, and refined day/night theming.

**Duration Estimate:** 2 days

### Deliverables

| ID | Item | Details |
|----|------|---------|
| P4-D1 | PWA manifest | `manifest.json` with icons (192px, 512px), theme colors, display: standalone |
| P4-D2 | Service worker | next-pwa: offline shell, cache strategy, push notification support |
| P4-D3 | Time-based theme refresh | Check theme every 5min, animate transition on change |
| P4-D4 | Skeleton loaders | Message list, sidebar, user list — shimmer animation |
| P4-D5 | Empty states | Empty room state, empty DM list state, with illustration and CTA |
| P4-D6 | Error boundaries | React error boundaries for chat and socket errors |
| P4-D7 | Toast notifications | In-app message notifications (held if user is typing) |
| P4-D8 | Keyboard shortcuts | `Cmd+K` room search, `Esc` close panel, `Cmd+/` settings |
| P4-D9 | Message search | Full-text search within a room (Redis FT.SEARCH) |
| P4-D10 | Scroll anchoring | Smart scroll: stays at bottom if user was at bottom, else shows "N new" badge |
| P4-D11 | Accessibility audit | ARIA labels, focus management, screen reader testing |
| P4-D12 | Mobile responsive polish | Bottom nav on mobile, fullscreen chat, keyboard-aware viewport |
| P4-D13 | Link previews | OG meta scraping for URLs in messages (via `/api/preview`) |
| P4-D14 | Image upload | Paste or drag image → Vercel Blob or Cloudinary upload |

### Day/Night Theme Transition

```css
:root {
  transition:
    background-color 400ms ease,
    color 400ms ease,
    border-color 400ms ease;
}
```

```typescript
// ThemeProvider.tsx
useEffect(() => {
  const interval = setInterval(() => {
    const newTheme = getTimeBasedTheme();
    if (newTheme !== currentTheme && !manualOverride) {
      setTheme(newTheme); // triggers CSS transition
    }
  }, 5 * 60 * 1000); // every 5 minutes
  return () => clearInterval(interval);
}, [currentTheme, manualOverride]);
```

### PWA Offline Behavior

- Last 50 messages cached in IndexedDB via service worker
- Offline indicator banner shown
- Input disabled with "Reconnecting..." state
- Push notification payload structure:
  ```json
  {
    "title": "WaitChat",
    "body": "Alice: Hey are you there?",
    "icon": "/icons/icon-192.png",
    "data": { "roomId": "abc123", "url": "/room/abc123" }
  }
  ```

### Phase 4 Acceptance Criteria

- [ ] App installs as PWA on Android and Desktop Chrome
- [ ] Theme switches from light to dark at exactly 18:00 with smooth transition
- [ ] Theme switches from dark to light at exactly 06:00 with smooth transition
- [ ] Manual toggle overrides auto-switch for the current session
- [ ] Skeleton loaders appear within 100ms of navigation
- [ ] All empty states have an illustration and primary action
- [ ] Push notifications arrive when app is backgrounded and user is not typing
- [ ] Push notifications are held/batched if user is typing
- [ ] Keyboard shortcuts work as documented
- [ ] App works with no network (offline shell shows, graceful degradation)
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse performance score ≥ 85
- [ ] WCAG AA on all text/background combinations in both themes

---

## Phase 5 PRD — Final Deployment & Hardening

**Goal:** Production deployment, monitoring, security hardening, and performance optimization.

**Duration Estimate:** 1–2 days

### Deliverables

| ID | Item | Details |
|----|------|---------|
| P5-D1 | Production Vercel deploy | Custom domain (optional), env vars set, edge config |
| P5-D2 | Railway Socket.IO deploy | Production socket server with health check, auto-restart |
| P5-D3 | Rate limiting | Upstash Ratelimit: 30 messages/min per user, 100 API calls/min |
| P5-D4 | Input sanitization | DOMPurify on client, server-side Zod + strip-tags |
| P5-D5 | CSP headers | Content-Security-Policy via `next.config.ts` headers |
| P5-D6 | Vercel Analytics | Web Vitals tracking, custom event for "messages held" |
| P5-D7 | Error tracking | Sentry integration (free tier) |
| P5-D8 | Message retention | Redis TTL: messages expire after 30 days |
| P5-D9 | Load testing | k6 script: 50 concurrent users, 10 msg/s for 60s |
| P5-D10 | Playwright E2E suite | Full happy path + hold mechanic scenarios |
| P5-D11 | README | Setup guide, env vars, deploy instructions |
| P5-D12 | Demo video | 60s screen recording of the hold mechanic in action |

### Production Environment Variables

```bash
# Vercel Dashboard → Environment Variables
NEXTAUTH_URL=https://waitchat.vercel.app
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXT_PUBLIC_SOCKET_URL=https://waitchat-socket.railway.app
UPSTASH_REDIS_REST_URL=<from Upstash>
UPSTASH_REDIS_REST_TOKEN=<from Upstash>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from web-push>
VAPID_PRIVATE_KEY=<from web-push>
SENTRY_DSN=<from Sentry>
```

### Security Checklist

- [ ] All user-generated content sanitized before storage and before render
- [ ] Socket.IO connections authenticated (JWT token verified on connection)
- [ ] CORS restricted to known origins
- [ ] Rate limiting active on all write endpoints
- [ ] `httpOnly` session cookies
- [ ] CSP blocks inline scripts (except Next.js nonce)
- [ ] No PII stored (no email, no password, name only)

### Phase 5 Acceptance Criteria

- [ ] Production URL is publicly accessible
- [ ] Socket.IO server health check passes
- [ ] 50 concurrent users can chat simultaneously with < 500ms latency
- [ ] Rate limiter returns 429 after threshold
- [ ] XSS injection in message content is sanitized (no script execution)
- [ ] Sentry captures test error thrown intentionally
- [ ] Vercel Analytics shows real Web Vitals data
- [ ] All Playwright E2E tests pass on production URL
- [ ] README is complete and another developer can set up locally from it

---

## Test Cases — All Phases

### Phase 1 Tests

| TC-ID | Test | Input | Expected Output | Pass Criteria |
|-------|------|-------|-----------------|---------------|
| TC-1-01 | App starts | `bun dev` | Server at localhost:3000 | HTTP 200 on / |
| TC-1-02 | Build succeeds | `bun run build` | No TypeScript errors | Exit code 0 |
| TC-1-03 | Theme at 8AM | `getTimeBasedTheme()` with hour=8 | `'light'` | Returns `'light'` |
| TC-1-04 | Theme at 9PM | `getTimeBasedTheme()` with hour=21 | `'dark'` | Returns `'dark'` |
| TC-1-05 | Theme at midnight | `getTimeBasedTheme()` with hour=0 | `'dark'` | Returns `'dark'` |
| TC-1-06 | Manual toggle | Click toggle in light mode | Switches to dark | `data-theme="dark"` on `<html>` |
| TC-1-07 | Username validation | Submit empty username | Error message shown | Error visible, no session |
| TC-1-08 | Username validation | Submit 1-char username | Error message shown | Min length enforced |
| TC-1-09 | Username validation | Submit valid "Alice" | Session created | Redirect to /room or dashboard |
| TC-1-10 | Health check | `GET /api/health` | `{status:"ok"}` | HTTP 200, valid JSON |
| TC-1-11 | Mobile layout | Viewport 375px | No horizontal overflow | Layout fits without scroll |
| TC-1-12 | Vercel preview | Push to feature branch | Preview URL deployed | URL accessible |

### Phase 2 Tests

| TC-ID | Test | Input | Expected Output | Pass Criteria |
|-------|------|-------|-----------------|---------------|
| TC-2-01 | Message send | User A types "Hello" and sends | User B sees "Hello" | Appears within 500ms |
| TC-2-02 | Message history | User joins existing room | Last 50 messages load | Messages visible immediately |
| TC-2-03 | Typing indicator | User A types (does not send) | User B sees "Alice is typing..." | Indicator appears within 300ms |
| TC-2-04 | Typing stops | User A stops typing for 2s | Indicator disappears for User B | Indicator gone within 2.2s |
| TC-2-05 | Self-no-indicator | User A types | User A does NOT see own typing indicator | No self-indicator |
| TC-2-06 | Emoji reaction | User A reacts 👍 to message | User B sees 👍 on message | Reaction count updates in real time |
| TC-2-07 | Reconnection | Kill network for 5s, restore | Messages resume | No messages lost, auto-reconnect |
| TC-2-08 | Room creation | POST /api/rooms | Room ID returned | Room persists in Redis |
| TC-2-09 | Pagination | Scroll to top in room with 100+ messages | Older messages load | 50 more loaded on scroll |
| TC-2-10 | User presence | User B disconnects | User A sees presence dot go offline | Dot updates within 5s |
| TC-2-11 | Invalid room | GET /room/nonexistent | Redirect to home | HTTP redirect, no crash |
| TC-2-12 | Long message | Send 2000-char message | Message renders without overflow | Wraps correctly in bubble |

### Phase 3 Tests — The Core Mechanic

| TC-ID | Test | Input | Expected Output | Pass Criteria |
|-------|------|-------|-----------------|---------------|
| TC-3-01 | Current tab hold | User A types in WaitChat → User B sends message | Message held | Message does NOT appear while A types |
| TC-3-02 | Current tab flush | User A stops typing (1500ms idle) | Queued messages appear | All queued messages flush in order |
| TC-3-03 | Queue order | 3 messages arrive while A types | On flush, they appear in timestamp order | Correct order maintained |
| TC-3-04 | Sender self-hold | User A sends message, immediately continues typing | A does NOT see their own message yet | Self-message in queue |
| TC-3-05 | Sender self-flush | User A stops typing after send | A sees their own message appear | Self-message flushes with others |
| TC-3-06 | Cross-tab hold | User A opens Tab 2 (WaitChat), types there | Tab 1 holds messages | BroadcastChannel sync working |
| TC-3-07 | Cross-tab flush | User A stops typing in Tab 2 | Tab 1 flushes queue | Flush within 1500ms of idle |
| TC-3-08 | Cross-origin tab | User A opens Google.com tab, types | Tab hold extended by ghost window | Hold active for ghostWindowMs |
| TC-3-09 | OS switch | User A switches to VS Code, types | Ghost window hold active | Hold active for 3000ms after blur |
| TC-3-10 | Ghost window expiry | 3000ms after blur, user still in OS app | Hold released | Messages flush after ghost expiry |
| TC-3-11 | HoldBadge count | 5 messages queued | HoldBadge shows "5" | Correct count displayed |
| TC-3-12 | CaughtUpIndicator | Queue flushes | "You're all caught up" shown | Appears and fades within 2s |
| TC-3-13 | Idle timeout setting | Change timeout to 500ms | Flush happens after 500ms idle | Setting respected |
| TC-3-14 | OS heuristic disable | Disable Layer 4 in settings | No hold on OS app switch | Only browser-level detection |
| TC-3-15 | Queue max size | 100 messages queued while A types | All 100 flush in order | No messages lost, no crash |
| TC-3-16 | Stagger animation | 5 messages flush | Messages appear with 120ms stagger | Visual stagger perceptible |
| TC-3-17 | Non-typer sees real-time | User B not typing | Messages appear without hold | No queue for non-typing user |
| TC-3-18 | BroadcastChannel cleanup | Close Tab 2 | No stale typing state in Tab 1 | Tab 1 detects idle after Tab 2 closes |

### Phase 4 Tests

| TC-ID | Test | Input | Expected Output | Pass Criteria |
|-------|------|-------|-----------------|---------------|
| TC-4-01 | PWA install | Visit site in Chrome | Install prompt appears | "Add to Home Screen" available |
| TC-4-02 | Offline shell | Disconnect network, navigate | Last 50 messages shown | App doesn't crash, shows offline indicator |
| TC-4-03 | Theme at 18:00 | System clock hits 18:00 | Theme transitions to dark | Smooth 400ms transition |
| TC-4-04 | Theme at 06:00 | System clock hits 06:00 | Theme transitions to light | Smooth 400ms transition |
| TC-4-05 | Skeleton loader | Navigate to room | Skeleton shown before messages load | Shimmer visible, no flash of empty |
| TC-4-06 | Empty room | Join new empty room | Empty state illustration shown | Not a blank white screen |
| TC-4-07 | Push notification | Message arrives while app is backgrounded | Notification shown in OS | Notification appears |
| TC-4-08 | Held notification | Message arrives while typing, app backgrounded | Notification delayed | Notification sent after flush |
| TC-4-09 | Keyboard shortcut | Press Cmd+K | Room search opens | Search overlay appears |
| TC-4-10 | Lighthouse PWA | Run Lighthouse on production | Score ≥ 90 | Lighthouse report |
| TC-4-11 | Contrast check | Both themes | All text WCAG AA compliant | axe-core zero violations |
| TC-4-12 | Mobile nav | Viewport 375px | Bottom nav visible, sidebar hidden | Correct mobile layout |

### Phase 5 Tests

| TC-ID | Test | Input | Expected Output | Pass Criteria |
|-------|------|-------|-----------------|---------------|
| TC-5-01 | Rate limit | 31 messages in 1 min | 29th message 429 error | Rate limit returns 429 |
| TC-5-02 | XSS prevention | Send `<script>alert(1)</script>` | Script tag rendered as text | No alert fired |
| TC-5-03 | Load test | 50 concurrent users, 10 msg/s | < 500ms delivery | k6 report passing |
| TC-5-04 | Socket auth | Connect with invalid token | Connection rejected | 401 or disconnect |
| TC-5-05 | Sentry error | Trigger intentional error | Error in Sentry dashboard | Event appears in Sentry |
| TC-5-06 | E2E happy path | Full Playwright scenario | All assertions pass | Green CI |
| TC-5-07 | E2E hold mechanic | Playwright types in Tab A, B sends | Tab A holds, then flushes | Playwright E2E pass |
| TC-5-08 | Message expiry | Wait for Redis TTL (test with 10s TTL) | Old messages gone | Not returned by API |

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Message delivery latency (P95) | < 200ms |
| Socket.IO connection time | < 500ms |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Core Web Vitals LCP | < 2.5s |
| Core Web Vitals CLS | < 0.1 |
| Max concurrent users (MVP) | 100 |

### Reliability

| Metric | Target |
|--------|--------|
| Socket.IO uptime | 99.5% |
| Message delivery guarantee | At-least-once (with client dedup) |
| Auto-reconnect on network failure | Yes, within 5s |
| Data persistence | 30-day Redis TTL |

### Security

- No passwords stored
- No PII beyond display name
- Session tokens: `httpOnly`, `SameSite=Strict`, 24h expiry
- Socket connections authenticated via JWT derived from NextAuth session
- All input sanitized (Zod + DOMPurify)
- HTTPS only (Vercel enforces this)

---

## API Contracts

### REST API

```
POST   /api/auth          — Create/restore username session
POST   /api/rooms         — Create a new room
GET    /api/rooms         — List rooms for current user
GET    /api/rooms/[id]/messages?cursor=&limit=50
POST   /api/messages      — Send a message (also emits via socket)
POST   /api/messages/[id]/react  — Add/toggle emoji reaction
GET    /api/users/[id]    — Get user profile
GET    /api/health        — Health check
POST   /api/preview       — Fetch OG metadata for a URL (Phase 4)
POST   /api/push/subscribe — Register push subscription (Phase 4)
```

### Socket.IO Namespaces

```
/chat  — main namespace
  Events (client → server):
    room:join, room:leave
    message:send, typing:start, typing:stop
    reaction:add
    ping (heartbeat)
  
  Events (server → client):
    message:new, message:update
    typing:update
    user:joined, user:left, user:presence
    reaction:update
    pong (heartbeat response)
    error
```

---

## Known Constraints & Edge Cases

### Browser Security Model Limitation

The spec requests "ruthless" OS-level typing detection. The **Web Platform Security Model** does not allow JavaScript to read keystrokes from other applications or other browser origins directly. WaitChat's Layer 4 heuristic (ghost window after focus loss) is the maximum achievable within these constraints without browser extensions.

If browser extension support is added in a future version, a Chrome Extension with `chrome.input.ime` or `chrome.windows` APIs could provide true cross-app detection.

### BroadcastChannel Scope

`BroadcastChannel` is same-origin only. Tabs opened to `waitchat.vercel.app` will share typing state with each other, but a tab on `other-site.com` cannot be directly detected as "typing in WaitChat." The blur/focus heuristic is the bridge for cross-origin detection.

### Mobile Keyboards

Mobile virtual keyboards often do not fire `keydown` events for every character on all browsers. WaitChat uses `input` and `compositionupdate` events as supplementary detection on mobile to compensate.

### WebSocket on Vercel

Vercel Serverless Functions do not support long-lived WebSocket connections. The Socket.IO server must be hosted separately (Railway, Fly.io, or Render). An alternative is using a managed real-time service (Ably, Pusher, PartyKit) which removes this constraint at the cost of vendor lock-in.

### Concurrent Typing Queue Race Condition

If 100 messages arrive during a 10-second typing session, the flush animation (120ms stagger × 100 = 12s) may feel slow. Mitigation: for queue sizes > 20, reduce stagger to 50ms; for > 50, show messages instantly with a single batch animation.

---

*WaitChat PRD v1.0 — Sumit Bhagat, June 2026*
