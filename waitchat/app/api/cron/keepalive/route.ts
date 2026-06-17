// app/api/cron/keepalive/route.ts
// Called by Vercel Cron every 10 minutes to keep the Render Socket.IO server awake.
import { NextResponse } from 'next/server';

export async function GET() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (!socketUrl || socketUrl.includes('localhost')) {
    return NextResponse.json({ skipped: true, reason: 'local dev — no ping needed' });
  }

  try {
    const start = Date.now();
    const res = await fetch(`${socketUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });
    const elapsed = Date.now() - start;

    if (res.ok) {
      const body = await res.json();
      console.log(`[KeepAlive Cron] Socket server is alive (${elapsed}ms)`, body);
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
