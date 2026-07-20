import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const commentId = params.id;
  const body = await request.json();
  const { emoji, isReply, replyId } = body;

  if (!emoji) {
    return NextResponse.json({ message: 'Emoji requerido' }, { status: 400 });
  }

  try {
    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId) as any;
    if (!comment) {
      return NextResponse.json({ message: 'Comentario no encontrado' }, { status: 404 });
    }

    const isReplyInt = isReply ? 1 : 0;
    const replyIdVal = replyId || null;

    const existing = db.prepare(
      `SELECT id FROM comment_reactions
       WHERE comment_id = ? AND user_id = ? AND emoji = ? AND is_reply = ? AND (reply_id = ? OR (reply_id IS NULL AND ? IS NULL))`
    ).get(commentId, user.userId, emoji, isReplyInt, replyIdVal, replyIdVal) as any;

    if (existing) {
      db.prepare('DELETE FROM comment_reactions WHERE id = ?').run(existing.id);
    } else {
      db.prepare(
        `INSERT INTO comment_reactions (id, comment_id, user_id, emoji, is_reply, reply_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(uuidv4(), commentId, user.userId, emoji, isReplyInt, replyIdVal);
    }

    const reactions = db.prepare(
      `SELECT cr.emoji, cr.user_id, cr.id as reaction_id, cr.is_reply, cr.reply_id
       FROM comment_reactions cr
       WHERE cr.comment_id = ?`
    ).all(commentId) as any[];

    const grouped: Record<string, { emoji: string; count: number; users: string[] }> = {};
    for (const r of reactions) {
      const key = `${r.emoji}-${r.is_reply}-${r.reply_id || ''}`;
      if (!grouped[key]) {
        grouped[key] = { emoji: r.emoji, count: 0, users: [] };
      }
      grouped[key].count++;
      grouped[key].users.push(r.user_id);
    }

    return NextResponse.json({
      id: commentId,
      reactions: Object.values(grouped),
    });
  } catch (err: any) {
    console.error('React error:', err);
    return NextResponse.json({ message: 'Error al procesar reacción' }, { status: 500 });
  }
}
