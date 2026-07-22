import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import db from '@/lib/db';

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.m4v': 'video/mp4',
  '.3gp': 'video/3gpp',
  '.ts': 'video/mp2t',
  '.m3u8': 'application/x-mpegURL',
};

function streamFile(filePath: string, start: number, end: number): ReadableStream<Uint8Array> {
  try {
    const nodeStream = fs.createReadStream(filePath, { start, end });
    return (Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>);
  } catch {
    const chunkSize = end - start + 1;
    const buffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, chunkSize, start);
    fs.closeSync(fd);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });
  }
}

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return new Response('Not found', { status: 404 });

  if (file.status === 'processing') {
    return new Response('Processing', { status: 503 });
  }
  if (file.status === 'error') {
    return new Response('Processing error', { status: 500 });
  }

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version || !version.file_path || !fs.existsSync(version.file_path)) {
    return new Response('File not found on disk', { status: 404 });
  }

  const ext = path.extname(file.name || file.original_name || '').toLowerCase();
  const mimeType = MIME_TYPES[ext] || file.mime_type || 'video/mp4';
  const stat = fs.statSync(version.file_path);
  const fileSize = stat.size;
  const rangeHeader = request.headers.get('range');

  const baseHeaders: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': mimeType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Cache-Control': 'public, max-age=86400',
    'Content-Disposition': 'inline',
  };

  if (stat.mtimeMs) {
    baseHeaders['Last-Modified'] = new Date(stat.mtimeMs).toUTCString();
  }
  const etag = `"${stat.size}-${stat.mtimeMs}"`;
  baseHeaders['ETag'] = etag;

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: baseHeaders });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : fileSize - 1;

    if (start >= fileSize || start > end) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const body = streamFile(version.file_path, start, end);
    return new Response(body, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunkSize),
      },
    });
  }

  const nodeStream = fs.createReadStream(version.file_path);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new Response(webStream, {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(fileSize) },
  });
}

export async function HEAD(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return new Response(null, { status: 404 });

  if (file.status === 'processing') return new Response(null, { status: 503 });
  if (file.status === 'error') return new Response(null, { status: 500 });

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version || !version.file_path || !fs.existsSync(version.file_path)) {
    return new Response(null, { status: 404 });
  }

  const ext = path.extname(file.name || file.original_name || '').toLowerCase();
  const mimeType = MIME_TYPES[ext] || file.mime_type || 'video/mp4';
  const stat = fs.statSync(version.file_path);

  return new Response(null, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeType,
      'Content-Length': String(stat.size),
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
