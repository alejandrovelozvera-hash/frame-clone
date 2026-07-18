import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function hasFFmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function needsTranscode(filePath: string): boolean {
  if (!hasFFmpeg()) return false;
  try {
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf-8', timeout: 10000 }
    ).trim();
    const codec = output.toLowerCase();
    return codec !== 'h264' && codec !== 'h.264';
  } catch {
    return false;
  }
}

export function transcodeToH264(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!hasFFmpeg()) {
      reject(new Error('FFmpeg not available'));
      return;
    }
    const ff = spawn('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    ff.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exit code ${code}: ${stderr.slice(-200)}`));
    });

    ff.on('error', reject);
  });
}

export function isH264(filePath: string): boolean {
  return !needsTranscode(filePath);
}

export function getTranscodedPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  return path.join(dir, `${base}_h264${ext}`);
}
