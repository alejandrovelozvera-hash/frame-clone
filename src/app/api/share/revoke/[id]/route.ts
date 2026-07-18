import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const link = db.prepare('SELECT * FROM shared_links WHERE id = ?').get(params.id) as any;
  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  db.prepare('UPDATE shared_links SET active = 0 WHERE id = ?').run(params.id);
  return NextResponse.json({ message: 'Link revoked' });
}
