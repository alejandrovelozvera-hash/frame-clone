import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db, { UPLOADS_DIR, THUMB_DIR } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let videosSize = 0;
  let videosCount = 0;
  let thumbsSize = 0;
  let thumbsCount = 0;

  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const f of files) {
        const p = path.join(UPLOADS_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) { videosSize += stat.size; videosCount++; }
        } catch {}
      }
    }
  } catch {}

  try {
    if (fs.existsSync(THUMB_DIR)) {
      const files = fs.readdirSync(THUMB_DIR);
      for (const f of files) {
        const p = path.join(THUMB_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) { thumbsSize += stat.size; thumbsCount++; }
        } catch {}
      }
    }
  } catch {}

  const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files').get() as any;

  const totalBytes = videosSize + thumbsSize;
  const totalMB = (totalBytes / 1024 / 1024).toFixed(1);

  return NextResponse.json({
    videos: { count: videosCount, sizeMB: (videosSize / 1024 / 1024).toFixed(1) },
    thumbnails: { count: thumbsCount, sizeMB: (thumbsSize / 1024 / 1024).toFixed(1) },
    totalMB,
    totalBytes,
    dbFiles: totalFiles?.count || 0,
  });
}
