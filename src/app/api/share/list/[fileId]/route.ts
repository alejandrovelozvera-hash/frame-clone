import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const links = db.prepare(`
    SELECT * FROM shared_links WHERE file_id = ? ORDER BY created_at DESC
  `).all(params.fileId);

  return NextResponse.json(links);
}
