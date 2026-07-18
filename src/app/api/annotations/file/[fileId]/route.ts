import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const timecode = request.nextUrl.searchParams.get('timecode');
  let annotations;
  if (timecode !== null) {
    const tc = parseFloat(timecode);
    annotations = db.prepare(
      "SELECT a.*, u.name as user_name, u.email as user_email FROM annotations a JOIN users u ON a.user_id = u.id WHERE a.file_id = ? AND ABS(a.timecode - ?) < 0.05 ORDER BY a.created_at ASC"
    ).all(params.fileId, tc);
  } else {
    annotations = db.prepare(
      "SELECT a.*, u.name as user_name, u.email as user_email FROM annotations a JOIN users u ON a.user_id = u.id WHERE a.file_id = ? ORDER BY a.timecode ASC"
    ).all(params.fileId);
  }
  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { timecode, type, data, color, stroke_width } = await request.json();
  if (timecode === undefined || !type || !data) {
    return NextResponse.json({ error: 'timecode, type, and data are required' }, { status: 400 });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO annotations (id, file_id, user_id, timecode, type, data, color, stroke_width) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, params.fileId, payload.userId, timecode, type, JSON.stringify(data), color || '#FF0000', stroke_width || 2);

  const annotation = db.prepare(
    'SELECT a.*, u.name as user_name, u.email as user_email FROM annotations a JOIN users u ON a.user_id = u.id WHERE a.id = ?'
  ).get(id);

  return NextResponse.json(annotation, { status: 201 });
}
