import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM files WHERE project_id = p.id) as file_count
    FROM projects p LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN project_members pm ON p.id = pm.project_id
    WHERE p.owner_id = ? OR pm.user_id = ?
    GROUP BY p.id ORDER BY p.updated_at DESC
  `).all(payload.userId, payload.userId);

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

  const id = uuidv4();
  db.prepare('INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)').run(id, name, description || '', payload.userId);
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(id, payload.userId, 'owner');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return NextResponse.json(project, { status: 201 });
}
