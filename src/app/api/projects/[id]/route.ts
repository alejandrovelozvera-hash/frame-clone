import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p
    JOIN users u ON p.owner_id = u.id WHERE p.id = ?
  `).get(params.id) as any;

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_url, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?
  `).all(params.id);

  const files = db.prepare(`
    SELECT f.*, u.name as uploader_name FROM files f
    JOIN users u ON f.uploaded_by = u.id WHERE f.project_id = ?
    ORDER BY f.created_at DESC
  `).all(params.id);

  return NextResponse.json({ ...project, members, files });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id) as any;
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.owner_id !== payload.userId) {
    return NextResponse.json({ error: 'Only owner can update' }, { status: 403 });
  }

  const { name, description } = await request.json();
  db.prepare("UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?")
    .run(name || null, description !== undefined ? description : null, params.id);

  return NextResponse.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id) as any;
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.owner_id !== payload.userId) {
    return NextResponse.json({ error: 'Only owner can delete' }, { status: 403 });
  }

  db.prepare('DELETE FROM project_members WHERE project_id = ?').run(params.id);
  db.prepare('DELETE FROM files WHERE project_id = ?').run(params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(params.id);
  return NextResponse.json({ message: 'Deleted' });
}
