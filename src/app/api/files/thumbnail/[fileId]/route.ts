import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import db, { UPLOADS_DIR } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return new Response('Not found', { status: 404 });

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version || !version.file_path || !fs.existsSync(version.file_path)) {
    return new Response('Not found', { status: 404 });
  }

  const thumbDir = path.join(path.dirname(UPLOADS_DIR), 'thumbnails');
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const thumbName = path.parse(file.name || file.original_name || '').name + '.jpg';
  const thumbPath = path.join(thumbDir, thumbName);

  if (!fs.existsSync(thumbPath)) {
    try {
      execSync(
        `ffmpeg -i "${version.file_path}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbPath}" -y`,
        { stdio: 'ignore', timeout: 15000 }
      );
    } catch {}
  }

  if (fs.existsSync(thumbPath)) {
    const buffer = fs.readFileSync(thumbPath);
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(null, { status: 204 });
}
