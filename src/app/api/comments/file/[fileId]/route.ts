import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.file_id = ?
    ORDER BY c.timecode ASC, c.created_at ASC
  `).all(params.fileId);

  const map = new Map<string, any>();
  const roots: any[] = [];
  (comments as any[]).forEach(c => map.set(c.id, { ...c, replies: [] }));
  (comments as any[]).forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id).replies.push(map.get(c.id));
    else if (!c.parent_id) roots.push(map.get(c.id));
  });

  return NextResponse.json(roots);
}

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content, timecode, parent_id } = await request.json();
  if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, file_id, user_id, content, timecode, parent_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, params.fileId, payload.userId, content, timecode || null, parent_id || null);

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar_url
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(id);

  return NextResponse.json(comment, { status: 201 });
}
