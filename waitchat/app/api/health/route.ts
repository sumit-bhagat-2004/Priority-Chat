// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    ts: new Date().toISOString(),
    version: '1.0.0',
  });
}
