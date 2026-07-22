import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from './db';

const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const useR2 = !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

let s3Client: S3Client | null = null;
if (useR2) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export function r2Enabled(): boolean {
  return useR2;
}

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (!useR2 || !s3Client) throw new Error('R2 not configured');
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function uploadFileFromPath(localPath: string, key: string, contentType?: string): Promise<void> {
  if (!useR2 || !s3Client) return;
  try {
    const buffer = fs.readFileSync(localPath);
    await uploadToR2(key, buffer, contentType || 'application/octet-stream');
  } catch (err) {
    console.error('R2 upload failed:', err);
  }
}

export async function uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const localPath = path.join(UPLOADS_DIR, key);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(localPath, buffer);

  if (useR2 && s3Client) {
    try {
      await uploadToR2(key, buffer, contentType);
    } catch (err) {
      console.error('R2 upload failed, using local fallback:', err);
    }
  }

  return localPath;
}

export function getR2Key(fileId: string, versionNumber: number, fileName: string): string {
  return `${fileId}/v${versionNumber}/${fileName}`;
}

export function getHlsR2Key(fileId: string, versionNumber: number, fileName: string): string {
  return `${fileId}/v${versionNumber}/hls/`;
}

export function getR2PublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return '';
}

export async function deleteFromR2(key: string): Promise<void> {
  if (!useR2 || !s3Client) return;
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
  } catch (err) {
    console.error('R2 delete failed:', err);
  }
}
