import { NextRequest } from 'next/server';
import fs from 'fs';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) {
    return new Response(JSON.stringify({ error: 'File not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version || !version.file_path || !fs.existsSync(version.file_path)) {
    return new Response(JSON.stringify({ error: 'Video file not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const stat = fs.statSync(version.file_path);
  const fileSize = stat.size;
  const range = request.headers.get('range');

  const headers: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': file.mime_type || 'video/mp4',
    'Access-Control-Allow-Origin': '*',
  };

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
    }

    const chunksize = end - start + 1;
    const buffer = Buffer.alloc(chunksize);
    const fd = fs.openSync(version.file_path, 'r');
    fs.readSync(fd, buffer, 0, chunksize, start);
    fs.closeSync(fd);

    return new Response(buffer, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunksize),
      },
    });
  }

  const fullBuffer = fs.readFileSync(version.file_path);
  return new Response(fullBuffer, {
    status: 200,
    headers: { ...headers, 'Content-Length': String(fileSize) },
  });
}
