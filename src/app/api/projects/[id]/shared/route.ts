import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const links = db.prepare(`
    SELECT sl.*, f.original_name, f.name as file_name
    FROM shared_links sl
    JOIN files f ON f.id = sl.file_id
    WHERE sl.project_id = ?
    ORDER BY sl.created_at DESC
  `).all(params.id);

  return NextResponse.json(links);
}
