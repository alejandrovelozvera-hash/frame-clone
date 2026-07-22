import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import db, { UPLOADS_DIR } from '@/lib/db';
import { getR2PublicUrl } from '@/lib/storage';

const MIME_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.mp4': 'video/mp4',
};

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file || !file.hls_path) {
    return new Response('HLS not available', { status: 404 });
  }

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version) return new Response('Not found', { status: 404 });

  const url = new URL(request.url);
  const subpath = url.searchParams.get('path') || 'master.m3u8';

  const r2Public = process.env.R2_PUBLIC_URL || '';
  if (r2Public && version.r2_key) {
    const r2Base = `${file.id}/v${version.version_number}/hls/`;
    const redirectUrl = `${r2Public}/${r2Base}${subpath}`;
    return Response.redirect(redirectUrl, 307);
  }

  const hlsDir = path.join(UPLOADS_DIR, file.id, `v${version.version_number}`, 'hls');
  const filePath = path.join(hlsDir, subpath);

  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
