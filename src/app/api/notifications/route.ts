import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const notifications = db.prepare(
      `SELECT id, user_id, type, message, data, read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    ).all(user.userId);

    return NextResponse.json(notifications);
  } catch (err: any) {
    console.error('Error loading notifications:', err);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
