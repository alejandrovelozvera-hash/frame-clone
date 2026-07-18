import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const user = db.prepare('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?').get(payload.userId) as any;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
