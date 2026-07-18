import { NextRequest, NextResponse } from 'next/server';
import { cleanOldFiles } from '@/lib/cleanup';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // allow CRON_SECRET (for Railway cron) OR user token (for manual cleanup)
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  const isCron = secret && auth === `Bearer ${secret}`;
  const isUser = !isCron && verifyToken(request);

  if (!isCron && !isUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = cleanOldFiles(7);
  return NextResponse.json({ ok: true, ...result });
}
