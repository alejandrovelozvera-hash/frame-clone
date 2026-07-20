import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(params.id, user.userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
