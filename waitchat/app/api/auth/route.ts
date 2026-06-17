// app/api/auth/route.ts - Username-only session creation
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';

const CreateSessionSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(24, 'Name must be at most 24 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .transform(s => s.trim()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check existing user or create new
    let user = await store.getUserByName(name);
    if (!user) {
      user = await store.createUser(name);
    }

    const token = await store.createSession(user.id);

    const response = NextResponse.json({ user, token });
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('waitchat-session', token, {
      httpOnly: true,
      secure: isProd,          // HTTPS only in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,   // 24h
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('waitchat-session')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const userId = await store.getUserIdFromSession(token);
  if (!userId) return NextResponse.json({ user: null }, { status: 401 });

  const user = await store.getUser(userId);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('waitchat-session');
  return response;
}
