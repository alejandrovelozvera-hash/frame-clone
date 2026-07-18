import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import db, { UPLOADS_DIR } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version || !version.file_path || !fs.existsSync(version.file_path)) {
    return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const thumbDir = path.join(path.dirname(UPLOADS_DIR), 'thumbnails');
  const thumbName = path.parse(file.name || file.original_name || '').name + '.jpg';
  const thumbPath = path.join(thumbDir, thumbName);

  if (fs.existsSync(thumbPath)) {
    const buffer = fs.readFileSync(thumbPath);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const videoBuffer = fs.readFileSync(version.file_path);
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  try {
    const firstFrame = videoBuffer.slice(0, Math.min(65536, videoBuffer.length));
    fs.writeFileSync(thumbPath, firstFrame);
  } catch {}

  return new Response(videoBuffer.slice(0, Math.min(65536, videoBuffer.length)), {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
