// app/api/rooms/[roomId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('waitchat-session')?.value;
  if (!token) return null;
  const userId = store.getUserIdFromSession(token);
  if (!userId) return null;
  return store.getUser(userId);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const room = store.getRoom(roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
  const before = searchParams.get('before') ?? undefined;

  const msgs = store.getMessages(roomId, limit, before);
  return NextResponse.json({ messages: msgs, hasMore: msgs.length === limit });
}
