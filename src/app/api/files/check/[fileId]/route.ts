import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT id, name, original_name, status, mime_type, size FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return NextResponse.json({ exists: false, error: 'File not in DB' });

  const version = db.prepare('SELECT file_path FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;
  if (!version) return NextResponse.json({ exists: false, error: 'Version not in DB', file });

  const videosDir = path.join(process.cwd(), 'uploads', 'videos');
  const onDisk = version.file_path && fs.existsSync(version.file_path);

  return NextResponse.json({
    exists: true, onDisk, file,
    version: { path: version.file_path, onDisk },
    uploadsDir: videosDir,
    uploadsExists: fs.existsSync(videosDir),
    dirContents: fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : [],
  });
}
