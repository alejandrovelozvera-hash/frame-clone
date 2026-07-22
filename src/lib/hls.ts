import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { UPLOADS_DIR } from './db';
import { uploadFileFromPath, getHlsR2Key, r2Enabled } from './storage';

function hasFFmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function convertToHls(
  inputPath: string,
  fileId: string,
  versionNumber: number,
  fileName: string
): Promise<string | null> {
  if (!hasFFmpeg()) return null;

  const hlsDir = path.join(UPLOADS_DIR, fileId, `v${versionNumber}`, 'hls');
  if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

  const outputPath = path.join(hlsDir, 'master.m3u8');

  return new Promise((resolve) => {
    const ff = spawn('ffmpeg', [
      '-i', inputPath,
      '-filter_complex',
      '[0:v]split=2[v1][v2];[v1]scale=-2:720[v1out];[v2]scale=-2:480[v2out]',
      '-map', '[v1out]', '-c:v:0', 'libx264', '-b:v:0', '2000k', '-maxrate:v:0', '2500k', '-bufsize:v:0', '3500k',
      '-map', '[v2out]', '-c:v:1', 'libx264', '-b:v:1', '800k', '-maxrate:v:1', '1050k', '-bufsize:v:1', '1600k',
      '-map', 'a:0', '-c:a', 'aac', '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-master_pl_name', 'master.m3u8',
      '-var_stream_map', 'v:0,a:0 v:1,a:0',
      '-y',
      path.join(hlsDir, '%v/playlist.m3u8'),
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    ff.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    ff.on('close', async (code) => {
      if (code !== 0) {
        console.error('HLS conversion failed:', stderr.slice(-300));
        resolve(null);
        return;
      }

      if (r2Enabled()) {
        const r2Base = getHlsR2Key(fileId, versionNumber, fileName);
        await uploadDirToR2(hlsDir, r2Base);
      }

      resolve('master.m3u8');
    });

    ff.on('error', (err) => {
      console.error('HLS spawn error:', err);
      resolve(null);
    });
  });
}

async function uploadDirToR2(localDir: string, r2Prefix: string): Promise<void> {
  try {
    const { uploadFileFromPath } = await import('./storage');
    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else {
          const relativePath = path.relative(localDir, fullPath).replace(/\\/g, '/');
          const r2Key = `${r2Prefix}${relativePath}`;
          const ext = path.extname(entry.name).toLowerCase();
          const mime = ext === '.m3u8' ? 'application/vnd.apple.mpegurl'
            : ext === '.ts' ? 'video/mp2t'
            : ext === '.mp4' ? 'video/mp4'
            : 'application/octet-stream';
          uploadFileFromPath(fullPath, r2Key, mime);
        }
      }
    };
    walkDir(localDir);
  } catch (err) {
    console.error('HLS R2 upload error:', err);
  }
}

export function getHlsUrl(fileId: string): string {
  const r2Public = process.env.R2_PUBLIC_URL || '';
  if (r2Public) {
    return `${r2Public}/${fileId}/hls/master.m3u8`;
  }
  return '';
}
