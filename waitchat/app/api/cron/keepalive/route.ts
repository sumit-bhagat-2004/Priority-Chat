// app/api/cron/keepalive/route.ts
// Called by Vercel Cron every 10 minutes to keep the Render Socket.IO server awake.
import { NextResponse } from 'next/server';

export async function GET() {
  // Use server-side env var (no NEXT_PUBLIC_ prefix needed for server routes)
  const socketUrl =
    process.env.SOCKET_SERVER_URL ??         // server-only private var (preferred)
    process.env.NEXT_PUBLIC_SOCKET_URL;      // fallback to public var

  if (!socketUrl || socketUrl.includes('localhost')) {
    return NextResponse.json({ skipped: true, reason: 'local dev — no ping needed' });
  }

  try {
    const start = Date.now();
    const res = await fetch(`${socketUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000), // 15s timeout — Render may be cold-starting
    });
    const elapsed = Date.now() - start;

    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log(`[KeepAlive Cron] Socket server alive (${elapsed}ms)`, body);
      return NextResponse.json({ ok: true, elapsed, body });
    }

    console.warn(`[KeepAlive Cron] Socket server returned ${res.status}`);
    return NextResponse.json({ ok: false, status: res.status }, { status: 502 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[KeepAlive Cron] Failed to reach socket server:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 503 });
  }
}
