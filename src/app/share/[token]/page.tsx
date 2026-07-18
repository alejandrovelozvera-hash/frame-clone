'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/toast';
import { LoadingSkeleton } from '@/components/loading-skeleton';

export default function SharedView() {
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [visitorName, setVisitorName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('share_visitor_name');
    if (name) {
      setVisitorName(name);
      setShowNameInput(false);
    }
    fetch(`/api/share/${params.token}`)
      .then(r => r.json())
      .then(d => { setData(d); setComments(d.comments || []); })
      .catch(() => setError('Link inválido o expirado'))
      .finally(() => setLoading(false));
  }, [params.token]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play();
    setPlaying(!playing);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !visitorName.trim()) return;
    try {
      const res = await fetch(`/api/share/${params.token}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          visitor_name: visitorName,
          timecode: currentTime,
        }),
      });
      if (!res.ok) throw new Error('Error');
      const comment = await res.json();
      setComments((prev: any[]) => [...prev, comment]);
      setCommentText('');
      toast('Comentario enviado', 'success');
    } catch {
      toast('Error al enviar comentario', 'error');
    }
  };

  if (loading) return <LoadingSkeleton type="player" />;

  if (error || !data) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-xl font-semibold mb-2">Video no disponible</h1>
        <p className="text-gray-400 text-sm">{error || 'El link ha expirado o no es válido'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-white font-semibold text-sm truncate">{data.original_name || data.file_name}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">{data.project_name}</span>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={videoRef}
              className="max-w-full max-h-full outline-none"
              style={{ objectFit: 'contain' }}
              src={`/api/files/stream/${data.file_id}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlay}
              preload="auto"
              playsInline
              controls
            />
          </div>
        </div>

        {mobileSidebarOpen && (
          <div className="sm:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileSidebarOpen(false)} />
        )}

        <div className={`${mobileSidebarOpen ? 'fixed right-0 top-0 bottom-0 w-[85vw] z-50 border-l border-gray-800' : 'hidden sm:flex'} w-80 bg-gray-900 flex-col shrink-0`}>
          <div className="p-3 border-b border-gray-800">
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider mb-2">Comentarios</h2>
            {showNameInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  placeholder="Tu nombre"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => { localStorage.setItem('share_visitor_name', visitorName); setShowNameInput(false); }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder={`Comentar en ${formatTime(currentTime)}...`}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleAddComment} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Enviar</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-xs text-gray-500 mb-2">Comentando como <span className="text-gray-300 font-medium">{visitorName}</span></p>
            {comments.map((c: any) => (
              <div key={c.id} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 font-medium">{c.visitor_name || c.user_name || 'Anónimo'}</span>
                  {c.timecode !== null && (
                    <button
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime = c.timecode; }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {formatTime(c.timecode)}
                    </button>
                  )}
                </div>
                <p className="text-xs text-white">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-8">Sin comentarios aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
