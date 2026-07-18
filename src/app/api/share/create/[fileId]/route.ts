import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const shareId = uuidv4();
  const token = uuidv4();
  const expiresAt = body.expires_in_days
    ? new Date(Date.now() + body.expires_in_days * 86400000).toISOString().replace('T', ' ').slice(0, 19)
    : null;

  db.prepare(`
    INSERT INTO shared_links (id, file_id, token, project_id, created_by, expires_at, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(shareId, params.fileId, token, file.project_id, payload.userId, expiresAt);

  return NextResponse.json({
    id: shareId,
    token,
    url: `${request.nextUrl.origin}/share/${token}`,
    expires_at: expiresAt,
  }, { status: 201 });
}
