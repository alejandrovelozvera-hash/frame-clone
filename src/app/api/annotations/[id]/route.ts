import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const annotation = db.prepare('SELECT * FROM annotations WHERE id = ?').get(params.id) as any;
  if (!annotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (annotation.user_id !== payload.userId) return NextResponse.json({ error: 'Not yours' }, { status: 403 });

  const { data, color, stroke_width } = await request.json();
  db.prepare('UPDATE annotations SET data = ?, color = ?, stroke_width = ? WHERE id = ?')
    .run(JSON.stringify(data), color || annotation.color, stroke_width || annotation.stroke_width, params.id);

  return NextResponse.json(db.prepare('SELECT * FROM annotations WHERE id = ?').get(params.id));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const annotation = db.prepare('SELECT * FROM annotations WHERE id = ?').get(params.id) as any;
  if (!annotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (annotation.user_id !== payload.userId) return NextResponse.json({ error: 'Not yours' }, { status: 403 });

  db.prepare('DELETE FROM annotations WHERE id = ?').run(params.id);
  return NextResponse.json({ message: 'Deleted' });
}
