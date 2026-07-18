import db, { UPLOADS_DIR, THUMB_DIR } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export function cleanOldFiles(days: number = 7): { deleted: number; freed: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);

  const oldFiles = db.prepare(
    `SELECT f.id, f.name, f.original_name, v.file_path FROM files f
     LEFT JOIN versions v ON v.file_id = f.id
     WHERE f.created_at < ?`
  ).all(cutoffStr) as any[];

  let deleted = 0;
  let freed = 0;

  for (const file of oldFiles) {
    try {
      if (file.file_path && fs.existsSync(file.file_path)) {
        const stat = fs.statSync(file.file_path);
        freed += stat.size;
        fs.unlinkSync(file.file_path);
      }

      // clean thumbnail
      const thumbName = path.parse(file.original_name || file.name || '').name + '.jpg';
      const thumbPath = path.join(THUMB_DIR, thumbName);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    } catch {}

    db.transaction(() => {
      db.prepare('DELETE FROM annotations WHERE file_id = ?').run(file.id);
      db.prepare('DELETE FROM comments WHERE file_id = ?').run(file.id);
      db.prepare('DELETE FROM reviews WHERE file_id = ?').run(file.id);
      db.prepare('DELETE FROM versions WHERE file_id = ?').run(file.id);
      db.prepare('DELETE FROM notifications WHERE data LIKE ?').run(`%"fileId":"${file.id}"%`);
      db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
    })();

    deleted++;
  }

  db.pragma('wal_checkpoint(TRUNCATE)');

  return { deleted, freed };
}
