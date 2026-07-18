import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.email as reviewer_email FROM reviews r
    JOIN users u ON r.reviewer_id = u.id WHERE r.file_id = ?
    ORDER BY r.created_at DESC
  `).all(params.fileId);

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = db.prepare("SELECT * FROM reviews WHERE file_id = ? AND reviewer_id = ? AND status = 'pending'")
    .get(params.fileId, payload.userId);
  if (existing) return NextResponse.json({ error: 'You already have a pending review' }, { status: 409 });

  const id = uuidv4();
  db.prepare("INSERT INTO reviews (id, file_id, reviewer_id, status) VALUES (?, ?, ?, 'pending')")
    .run(id, params.fileId, payload.userId);

  const review = db.prepare(
    'SELECT r.*, u.name as reviewer_name, u.email as reviewer_email FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.id = ?'
  ).get(id);

  return NextResponse.json(review, { status: 201 });
}
