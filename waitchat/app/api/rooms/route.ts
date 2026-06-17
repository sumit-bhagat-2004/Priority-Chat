// app/api/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(50).transform(s => s.trim()),
  isGroup: z.boolean().default(true),
});

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('waitchat-session')?.value;
  if (!token) return null;
  const userId = await store.getUserIdFromSession(token);
  if (!userId) return null;
  return await store.getUser(userId);
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rooms = await store.getAllRooms();
  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const room = await store.createRoom(parsed.data.name, user.id, parsed.data.isGroup);
    return NextResponse.json({ room }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
