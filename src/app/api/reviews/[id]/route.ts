import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(params.id) as any;
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (review.reviewer_id !== payload.userId) return NextResponse.json({ error: 'Not your review' }, { status: 403 });
  if (review.status !== 'pending') return NextResponse.json({ error: 'Review already completed' }, { status: 409 });

  const { decision, feedback } = await request.json();
  if (!decision || !['approved', 'changes_requested', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Decision must be: approved, changes_requested, or rejected' }, { status: 400 });
  }

  db.prepare("UPDATE reviews SET status = 'completed', decision = ?, feedback = ?, completed_at = datetime('now') WHERE id = ?")
    .run(decision, feedback || null, params.id);
  db.prepare("UPDATE files SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(decision === 'approved' ? 'approved' : 'changes_requested', review.file_id);

  return NextResponse.json(
    db.prepare('SELECT r.*, u.name as reviewer_name, u.email as reviewer_email FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.id = ?').get(params.id)
  );
}
