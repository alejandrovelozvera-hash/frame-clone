import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db, { DATA_DIR, UPLOADS_DIR } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(params.fileId) as any;
  if (!file) return NextResponse.json({ error: 'File not in DB' });

  const version = db.prepare('SELECT * FROM versions WHERE file_id = ? ORDER BY version_number DESC LIMIT 1').get(params.fileId) as any;

  const debug = {
    file,
    version: version ? { id: version.id, path: version.file_path, exists: fs.existsSync(version.file_path) } : null,
    paths: {
      cwd: process.cwd(),
      dataDir: DATA_DIR,
      uploadsDir: UPLOADS_DIR,
      dataDirExists: fs.existsSync(DATA_DIR),
      uploadsDirExists: fs.existsSync(UPLOADS_DIR),
    },
    uploadsContent: fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [],
    dataContent: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [],
  };

  if (version && fs.existsSync(version.file_path)) {
    const stat = fs.statSync(version.file_path);
    debug['fileStats'] = {
      size: stat.size,
      mode: stat.mode,
      birthtime: stat.birthtime,
    };
    const ext = path.extname(file.name || '').toLowerCase();
    debug['extension'] = ext;
    debug['mimeType'] = file.mime_type;
  }

  return NextResponse.json(debug);
}
