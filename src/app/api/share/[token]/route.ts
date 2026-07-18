import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const link = db.prepare(`
    SELECT sl.*, f.name as file_name, f.original_name, f.mime_type, f.size, f.duration,
           p.name as project_name
    FROM shared_links sl
    JOIN files f ON f.id = sl.file_id
    JOIN projects p ON p.id = sl.project_id
    WHERE sl.token = ? AND sl.active = 1
  `).get(params.token) as any;

  if (!link) {
    return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    db.prepare('UPDATE shared_links SET active = 0 WHERE id = ?').run(link.id);
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
  }

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.file_id = ? AND c.status = 'active'
    ORDER BY c.created_at ASC
  `).all(link.file_id);

  return NextResponse.json({ ...link, comments });
}
