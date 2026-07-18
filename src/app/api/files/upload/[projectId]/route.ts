import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db, { UPLOADS_DIR } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const ext = path.extname(file.name);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const fileId = uuidv4();
  const fileSize = buffer.length;

  db.prepare(`
    INSERT INTO files (id, project_id, name, original_name, mime_type, size, status, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, 'ready', ?)
  `).run(fileId, params.projectId, fileName, file.name, file.type || 'video/mp4', fileSize, payload.userId);

  db.prepare(`
    INSERT INTO versions (id, file_id, version_number, file_path, size, uploaded_by)
    VALUES (?, ?, 1, ?, ?, ?)
  `).run(uuidv4(), fileId, filePath, fileSize, payload.userId);

  return NextResponse.json({
    id: fileId, name: fileName, original_name: file.name, status: 'ready', size: fileSize,
  }, { status: 201 });
}
