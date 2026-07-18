import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(params.id) as any;
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (comment.user_id !== payload.userId) return NextResponse.json({ error: 'Not your comment' }, { status: 403 });

  const { content } = await request.json();
  db.prepare("UPDATE comments SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, params.id);
  return NextResponse.json(db.prepare('SELECT * FROM comments WHERE id = ?').get(params.id));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(params.id) as any;
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (comment.user_id !== payload.userId) return NextResponse.json({ error: 'Not your comment' }, { status: 403 });

  db.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').run(params.id, params.id);
  return NextResponse.json({ message: 'Deleted' });
}
