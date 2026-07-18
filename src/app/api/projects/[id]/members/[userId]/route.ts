import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(params.id, payload.userId) as any;
  if (!project) return NextResponse.json({ error: 'Not found or not owner' }, { status: 404 });

  const { email, role } = await request.json();
  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as any;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id);
  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(params.id, user.id, role || 'viewer');
  return NextResponse.json({ message: 'Member added', user: { id: user.id, name: user.name, email: user.email, role: role || 'viewer' } }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(params.id, payload.userId) as any;
  if (!project) return NextResponse.json({ error: 'Not found or not owner' }, { status: 404 });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(params.id, params.userId);
  return NextResponse.json({ message: 'Member removed' });
}
