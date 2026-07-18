import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const link = db.prepare('SELECT * FROM shared_links WHERE token = ? AND active = 1').get(params.token) as any;
  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  if (!link.allow_comments) {
    return NextResponse.json({ error: 'Comments disabled' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const commentId = uuidv4();
  db.prepare(`
    INSERT INTO comments (id, file_id, visitor_name, content, timecode, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(commentId, link.file_id, body.visitor_name || 'Anónimo', body.content, body.timecode || null);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  return NextResponse.json(comment, { status: 201 });
}
