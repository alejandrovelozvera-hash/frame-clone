import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db, { UPLOADS_DIR } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { projectId: string; fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = db.prepare(`
    SELECT f.*, u.name as uploader_name, u.email as uploader_email FROM files f
    JOIN users u ON f.uploaded_by = u.id WHERE f.id = ? AND f.project_id = ?
  `).get(params.fileId, params.projectId) as any;

  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const versions = db.prepare(`
    SELECT v.*, u.name as uploader_name FROM versions v
    JOIN users u ON v.uploaded_by = u.id WHERE v.file_id = ?
    ORDER BY v.version_number DESC
  `).all(params.fileId);

  const commentsList = db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url FROM comments c
    JOIN users u ON c.user_id = u.id WHERE c.file_id = ?
    ORDER BY c.created_at ASC
  `).all(params.fileId);

  return NextResponse.json({ ...file, versions, comments: commentsList });
}

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string; fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = db.prepare('SELECT * FROM files WHERE id = ? AND project_id = ?').get(params.fileId, params.projectId) as any;
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const versions = db.prepare('SELECT * FROM versions WHERE file_id = ?').all(params.fileId) as any[];
  db.prepare('DELETE FROM comments WHERE file_id = ?').run(params.fileId);
  db.prepare('DELETE FROM annotations WHERE file_id = ?').run(params.fileId);
  db.prepare('DELETE FROM reviews WHERE file_id = ?').run(params.fileId);
  db.prepare('DELETE FROM versions WHERE file_id = ?').run(params.fileId);
  db.prepare('DELETE FROM files WHERE id = ?').run(params.fileId);

  for (const v of versions) {
    try { if (v.file_path && fs.existsSync(v.file_path)) fs.unlinkSync(v.file_path); } catch {}
  }
  const thumbDir = path.join(process.cwd(), 'uploads', 'thumbnails', path.parse(file.name).name);
  try { if (fs.existsSync(thumbDir)) fs.rmSync(thumbDir, { recursive: true, force: true }); } catch {}

  return NextResponse.json({ message: 'Deleted' });
}
