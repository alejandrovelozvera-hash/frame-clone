'use client';
import { useState } from 'react';

interface Comment {
  id: string;
  content: string;
  author: string;
  author_avatar?: string;
  created_at: string;
  resolved: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  replies: CommentReply[];
  timeline_seconds?: number;
}

interface CommentReply {
  id: string;
  content: string;
  author: string;
  created_at: string;
  reactions: { emoji: string; count: number; users: string[] }[];
}

interface CommentsPanelProps {
  comments: Comment[];
  onResolve: (commentId: string) => void;
  onAddComment: (content: string) => void;
  onAddReply: (commentId: string, content: string) => void;
  onReact: (commentId: string, emoji: string, isReply?: boolean, replyId?: string) => void;
  onSeekTo?: (seconds: number) => void;
  currentUser?: string;
}

export default function CommentsPanel({
  comments,
  onResolve,
  onAddComment,
  onAddReply,
  onReact,
  onSeekTo,
  currentUser = 'You'
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [editorFormat, setEditorFormat] = useState({ bold: false, italic: false, code: false });

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  const handleToggleReply = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyText('');
    } else {
      setReplyingTo(commentId);
      setReplyText('');
    }
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onAddReply(commentId, replyText.trim());
    setReplyText('');
    setReplyingTo(null);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleFormat = (type: 'bold' | 'italic' | 'code') => {
    setEditorFormat(prev => ({ ...prev, [type]: !prev[type] }));
    const textarea = document.getElementById('comment-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newComment;
    let wrapped = '';
    if (type === 'bold') wrapped = `__${text.substring(start, end) || 'bold'}__`;
    else if (type === 'italic') wrapped = `*${text.substring(start, end) || 'italic'}*`;
    else if (type === 'code') wrapped = `\`${text.substring(start, end) || 'code'}\``;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setNewComment(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + wrapped.length;
    }, 0);
  };

  const renderContent = (content: string) => {
    return content
      .split(/(__[^_]+__|\*[^*]+\*|`[^`]+`)/g)
      .map((part, i) => {
        if (part.startsWith('__') && part.endsWith('__')) {
          return <strong key={i} className="text-white/90">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i} className="text-white/80">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="text-[10px] bg-frame-800/80 text-blue-300 px-1 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
      });
  };

  const fmtTime = (s?: number) => {
    if (s === undefined) return null;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const EMOJIS = ['👍', '❤️', '😄', '🎯', '🚀', '👀'];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white/80">Comentarios</h3>
          <span className="text-[10px] text-frame-500">{activeComments.length} activos</span>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b border-white/[0.04]">
            <button
              onClick={() => handleFormat('bold')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${editorFormat.bold ? 'bg-blue-500/20 text-blue-400' : 'text-frame-400 hover:text-white hover:bg-white/5'}`}
            >
              B
            </button>
            <button
              onClick={() => handleFormat('italic')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs italic transition-all ${editorFormat.italic ? 'bg-blue-500/20 text-blue-400' : 'text-frame-400 hover:text-white hover:bg-white/5'}`}
            >
              I
            </button>
            <button
              onClick={() => handleFormat('code')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-mono transition-all ${editorFormat.code ? 'bg-blue-500/20 text-blue-400' : 'text-frame-400 hover:text-white hover:bg-white/5'}`}
            >
              {'</>'}
            </button>
          </div>
          <textarea
            id="comment-editor"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Agregá un comentario... (__bold__ *itálica* `código`)"
            className="w-full bg-transparent text-xs text-white/80 placeholder-frame-500 px-3 py-2 resize-none focus:outline-none min-h-[60px]"
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitComment(); }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[10px] text-frame-600">Ctrl+Enter</span>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-frame-800 disabled:text-frame-500 text-white rounded-lg text-[10px] font-medium transition-all active:scale-95"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeComments.length === 0 && resolvedComments.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-8 h-8 mx-auto text-frame-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-frame-500 text-xs">Sin comentarios</p>
            <p className="text-frame-600 text-[10px] mt-1">Usá el editor de arriba para comenzar</p>
          </div>
        )}

        {activeComments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment}
            replyingTo={replyingTo === comment.id}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            onToggleReply={() => handleToggleReply(comment.id)}
            onSubmitReply={() => handleSubmitReply(comment.id)}
            onResolve={() => onResolve(comment.id)}
            onReact={(emoji: string) => onReact(comment.id, emoji)}
            onReactReply={(replyId: string, emoji: string) => onReact(comment.id, emoji, true, replyId)}
            onSeekTo={onSeekTo}
            currentUser={currentUser}
            renderContent={renderContent}
            fmtTime={fmtTime}
            expandedReplies={expandedReplies}
            onToggleReplies={() => toggleReplies(comment.id)}
            EMOJIS={EMOJIS}
          />
        ))}

        {resolvedComments.length > 0 && (
          <details className="border-t border-white/[0.06]">
            <summary className="p-3 text-[10px] text-frame-500 hover:text-frame-300 cursor-pointer font-medium sticky top-0 bg-frame-900/90 backdrop-blur-sm">
              Resueltos ({resolvedComments.length})
            </summary>
            <div>
              {resolvedComments.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  replyingTo={false}
                  replyText=''
                  onReplyTextChange={() => {}}
                  onToggleReply={() => {}}
                  onSubmitReply={() => {}}
                  onResolve={() => onResolve(comment.id)}
                  onReact={(emoji: string) => onReact(comment.id, emoji)}
                  onReactReply={(replyId: string, emoji: string) => onReact(comment.id, emoji, true, replyId)}
                  onSeekTo={onSeekTo}
                  currentUser={currentUser}
                  renderContent={renderContent}
                  fmtTime={fmtTime}
                  expandedReplies={expandedReplies}
                  onToggleReplies={() => toggleReplies(comment.id)}
                  EMOJIS={EMOJIS}
                  resolved
                />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment, replyingTo, replyText, onReplyTextChange, onToggleReply, onSubmitReply,
  onResolve, onReact, onReactReply, onSeekTo, currentUser, renderContent, fmtTime,
  expandedReplies, onToggleReplies, EMOJIS, resolved
}: {
  comment: Comment;
  replyingTo: boolean;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  onToggleReply: () => void;
  onSubmitReply: () => void;
  onResolve: () => void;
  onReact: (emoji: string) => void;
  onReactReply: (replyId: string, emoji: string) => void;
  onSeekTo?: (s: number) => void;
  currentUser: string;
  renderContent: (c: string) => React.ReactNode;
  fmtTime: (s?: number) => string | null;
  expandedReplies: Set<string>;
  onToggleReplies: () => void;
  EMOJIS: string[];
  resolved?: boolean;
}) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={`px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${resolved ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[9px] text-white/70 font-medium">
            {(comment.author || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-white/70 font-medium">{comment.author}</span>
            {comment.timeline_seconds !== undefined && (
              <span className="text-[9px] text-frame-500">@{fmtTime(comment.timeline_seconds)}</span>
            )}
            <span className="text-[9px] text-frame-600 ml-auto">
              {new Date(comment.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed mb-2">{renderContent(comment.content)}</p>

          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-frame-400 hover:text-white text-[10px] transition-all"
            >
              <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              React
            </button>
            <button onClick={onToggleReply} className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-frame-400 hover:text-white text-[10px] transition-all">
              Reply
            </button>
            {onSeekTo && comment.timeline_seconds !== undefined && (
              <button onClick={() => onSeekTo(comment.timeline_seconds!)} className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-frame-400 hover:text-blue-400 text-[10px] transition-all">
                Seek
              </button>
            )}
            <button onClick={onResolve} className={`px-2 py-1 rounded-lg transition-all text-[10px] ${resolved ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.03] hover:bg-white/[0.06] text-frame-400 hover:text-white'}`}>
              {resolved ? 'Reabrir' : 'Resolver'}
            </button>
          </div>

          {showReactions && (
            <div className="flex items-center gap-1 mb-2 p-1.5 bg-white/[0.03] rounded-lg">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); setShowReactions(false); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-sm active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {comment.reactions.length > 0 && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {comment.reactions.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onReact(r.emoji)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] transition-all ${r.users.includes(currentUser) ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/[0.04] text-frame-400 hover:text-white border border-transparent'}`}
                >
                  {r.emoji} {r.count}
                </button>
              ))}
            </div>
          )}

          {comment.replies.length > 0 && (
            <>
              <button onClick={onToggleReplies} className="text-[10px] text-frame-400 hover:text-white transition-colors mb-1.5">
                {expandedReplies.has(comment.id) ? 'Ocultar' : 'Mostrar'} {comment.replies.length} respuesta{comment.replies.length !== 1 ? 's' : ''}
              </button>
              {expandedReplies.has(comment.id) && (
                <div className="space-y-2 pl-2 border-l border-white/[0.06]">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="py-1.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-white/60 font-medium">{reply.author}</span>
                        <span className="text-[8px] text-frame-600">
                          {new Date(reply.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed mb-1">{renderContent(reply.content)}</p>
                      {reply.reactions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {reply.reactions.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => onReactReply(reply.id, r.emoji)}
                              className={`px-1.5 py-0.5 rounded text-[9px] transition-all ${r.users.includes(currentUser) ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.04] text-frame-400 hover:text-white'}`}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {replyingTo && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={e => onReplyTextChange(e.target.value)}
                placeholder="Escribí una respuesta..."
                className="flex-1 px-2.5 py-1.5 bg-frame-800/80 border border-frame-700/50 rounded-lg text-xs text-white/80 placeholder-frame-500 focus:outline-none focus:border-blue-500/30"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmitReply(); }}
              />
              <button
                onClick={onSubmitReply}
                disabled={!replyText.trim()}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-frame-800 disabled:text-frame-500 text-white rounded-lg text-[10px] font-medium transition-all active:scale-95"
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
