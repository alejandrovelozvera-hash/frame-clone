import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import Busboy from '@fastify/busboy';
import db, { UPLOADS_DIR, THUMB_DIR } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { needsTranscode, transcodeToH264, getTranscodedPath, extractThumbnail, getVideoDimensions } from '@/lib/transcode';
import { uploadFileFromPath, getR2Key, r2Enabled } from '@/lib/storage';
import { convertToHls } from '@/lib/hls';

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  const payload = verifyToken(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.projectId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => { headersObj[key] = value; });
  if (!headersObj['content-type']) {
    return NextResponse.json({ error: 'Missing content-type header' }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve, reject) => {
    let fileId = uuidv4();
    let versionId = uuidv4();
    let fileName = '';
    let filePath = '';
    let originalName = '';
    let fileMime = 'video/mp4';
    let fileSize = 0;
    let writeStream: fs.WriteStream | null = null;
    let hasError = false;

    const bb = new Busboy({ headers: headersObj as any });

    bb.on('file', (fieldname, fileStream, filename, encoding, mimeType) => {
      if (fieldname !== 'file') { fileStream.resume(); return; }
      originalName = filename;
      fileMime = mimeType || 'video/mp4';
      const ext = path.extname(filename);
      fileName = uuidv4() + ext;
      filePath = path.join(UPLOADS_DIR, fileName);
      writeStream = fs.createWriteStream(filePath);

      fileStream.on('data', (chunk) => { fileSize += chunk.length; });
      fileStream.pipe(writeStream);
      fileStream.on('error', (err) => { hasError = true; cleanup(); reject(err); });
      writeStream.on('error', (err) => { hasError = true; cleanup(); reject(err); });
    });

    const cleanup = () => {
      if (writeStream) { try { writeStream.destroy(); } catch (e) {} }
      try { if (filePath) fs.unlinkSync(filePath); } catch (e) {}
    };

    bb.on('finish', () => {
      if (hasError || !writeStream || !filePath) {
        resolve(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }));
        return;
      }

      const sql1 = "INSERT INTO files (id, project_id, name, original_name, mime_type, size, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, 'processing', ?)";
      db.prepare(sql1).run(fileId, params.projectId, fileName, originalName, fileMime, fileSize, payload.userId);

      const sql2 = "INSERT INTO versions (id, file_id, version_number, file_path, size, uploaded_by) VALUES (?, ?, 1, ?, ?, ?)";
      db.prepare(sql2).run(versionId, fileId, filePath, fileSize, payload.userId);

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

          if (r2Enabled()) {
            const r2Key = getR2Key(fileId, 1, fileName);
            await uploadFileFromPath(filePath, r2Key, fileMime);
            db.prepare('UPDATE versions SET r2_key = ? WHERE id = ?').run(r2Key, versionId);
          }

          const thumbPath = extractThumbnail(filePath, THUMB_DIR, fileName);
          const dims = await getVideoDimensions(filePath);

          if (thumbPath || dims) {
            const updates: string[] = [];
            const vals: any[] = [];
            if (thumbPath) { updates.push('thumbnail_path = ?'); vals.push(thumbPath); }
            if (dims) { updates.push('width = ?, height = ?, duration = ?'); vals.push(dims.width, dims.height, dims.duration); }
            vals.push(fileId);
            const sql3 = "UPDATE files SET " + updates.join(", ") + " WHERE id = ?";
            db.prepare(sql3).run(...vals);
          }

          const hlsResult = await convertToHls(filePath, fileId, 1, fileName);
          if (hlsResult) {
            db.prepare('UPDATE files SET hls_path = ? WHERE id = ?').run(hlsResult, fileId);
          }
        } catch (e) {
          try { db.prepare('UPDATE files SET status = ? WHERE id = ?').run('error', fileId); } catch (e2) {}
        }
      });

      resolve(NextResponse.json({
        id: fileId, name: fileName, original_name: originalName, status: 'processing', size: fileSize,
      }, { status: 201 }));
    });

    bb.on('error', (err) => { cleanup(); reject(err); });

    if (request.body) {
      const nodeStream = Readable.fromWeb(request.body as any);
      nodeStream.pipe(bb);
    } else {
      resolve(NextResponse.json({ error: 'No request body' }, { status: 400 }));
    }
  });
}
