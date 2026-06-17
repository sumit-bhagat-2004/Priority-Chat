// app/api/dm/route.ts — Create or retrieve a DM room between current user and target user
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';

const DmSchema = z.object({
  targetUsername: z.string().min(1).max(24).transform(s => s.trim()),
});

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('waitchat-session')?.value;
  if (!token) return null;
  const userId = await store.getUserIdFromSession(token);
  if (!userId) return null;
  return await store.getUser(userId);
}

export async function POST(req: NextRequest) {
  const currentUser = await getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = DmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { targetUsername } = parsed.data;

    // Can't DM yourself
    if (targetUsername.toLowerCase() === currentUser.name.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot DM yourself' }, { status: 400 });
    }

    // Look up target user
    const targetUser = await store.getUserByName(targetUsername);
    if (!targetUser) {
      return NextResponse.json({ error: `User "${targetUsername}" not found` }, { status: 404 });
    }

    // Get or create DM room (deterministic ID)
    const room = await store.getOrCreateDmRoom(currentUser.id, targetUser.id);
    return NextResponse.json({ room, partnerId: targetUser.id, partnerName: targetUser.name });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
