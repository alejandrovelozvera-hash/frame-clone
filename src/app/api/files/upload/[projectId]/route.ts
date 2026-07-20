import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db, { UPLOADS_DIR, THUMB_DIR } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { needsTranscode, transcodeToH264, getTranscodedPath, extractThumbnail, getVideoDimensions } from '@/lib/transcode';

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const ext = path.extname(file.name);
  const fileName = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // stream to disk instead of buffering (avoids OOM for large files)
  const writeStream = fs.createWriteStream(filePath);
  const reader = (file as any).stream().getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { writeStream.end(); return; }
    writeStream.write(Buffer.from(value));
    return pump();
  };
  await pump();
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const fileId = uuidv4();

  db.prepare(`
    INSERT INTO files (id, project_id, name, original_name, mime_type, size, status, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, 'processing', ?)
  `).run(fileId, params.projectId, fileName, file.name, file.type || 'video/mp4', fileSize, payload.userId);

  const versionId = uuidv4();
  db.prepare(`
    INSERT INTO versions (id, file_id, version_number, file_path, size, uploaded_by)
    VALUES (?, ?, 1, ?, ?, ?)
  `).run(versionId, fileId, filePath, fileSize, payload.userId);

  process.nextTick(async () => {
    try {
      if (needsTranscode(filePath)) {
        const outPath = getTranscodedPath(filePath);
        await transcodeToH264(filePath, outPath);
        const outStat = fs.statSync(outPath);
        fs.unlinkSync(filePath);
        fs.renameSync(outPath, filePath);
        db.prepare('UPDATE versions SET size = ? WHERE id = ?').run(outStat.size, versionId);
        db.prepare('UPDATE files SET size = ?, status = ? WHERE id = ?').run(outStat.size, 'ready', fileId);
      } else {
        db.prepare('UPDATE files SET status = ? WHERE id = ?').run('ready', fileId);
      }

      // generate thumbnail
      const thumbPath = extractThumbnail(filePath, THUMB_DIR, fileName);

      // detect dimensions
      const dims = await getVideoDimensions(filePath);

      if (thumbPath || dims) {
        const updates: string[] = [];
        const vals: any[] = [];
        if (thumbPath) { updates.push('thumbnail_path = ?'); vals.push(thumbPath); }
        if (dims) { updates.push('width = ?, height = ?, duration = ?'); vals.push(dims.width, dims.height, dims.duration); }
        vals.push(fileId);
        db.prepare(`UPDATE files SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
      }
    } catch (err) {
      db.prepare('UPDATE files SET status = ? WHERE id = ?').run('error', fileId);
    }
  });

  return NextResponse.json({
    id: fileId, name: fileName, original_name: file.name, status: 'processing', size: fileSize,
  }, { status: 201 });
}
