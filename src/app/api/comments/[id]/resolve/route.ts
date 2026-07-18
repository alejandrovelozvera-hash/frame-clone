import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(params.id) as any;
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare("UPDATE comments SET status = 'resolved', resolved_at = datetime('now'), resolved_by = ? WHERE id = ?")
    .run(payload.userId, params.id);

  return NextResponse.json(db.prepare('SELECT * FROM comments WHERE id = ?').get(params.id));
}
