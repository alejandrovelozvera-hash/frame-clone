'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { files, comments, annotations as annotationsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/components/toast';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import CommentsPanel from '@/components/comments-panel';
import ReviewHeader from '@/components/review-header';

function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { toast } = useToast();

  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [commentList, setCommentList] = useState<any[]>([]);
  const [annotationsList, setAnnotationsList] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'arrow' | 'rectangle' | 'freehand' | 'highlight'>('freehand');
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [currentDrawPath, setCurrentDrawPath] = useState<any[]>([]);
  const [onlineReviewers, setOnlineReviewers] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number }>>({});
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'comments' | 'annotations' | 'versions' | 'reviews'>('comments');
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [videoSrc, setVideoSrc] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user && params.fileId) {
      loadFile();
      setupSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave:file', params.fileId);
      }
    };
  }, [user, authLoading, params.fileId]);

  const loadFile = async () => {
    try {
      const data = await files.get(projectId || '', params.fileId as string);
      setFile(data);
      setCommentList(data.comments || []);
      setDuration(data.duration || 0);
      setFileProcessing(data.status === 'processing');

      if (data.status !== 'processing' && data.status !== 'error') {
        setVideoSrc(`/api/files/stream/${params.fileId}?t=${Date.now()}`);
      }

      const annots = await annotationsApi.list(params.fileId as string);
      setAnnotationsList(annots);

      if (data.status === 'processing') {
        setTimeout(loadFile, 3000);
      }
    } catch (err: any) {
      toast(err.message, 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('join:file', params.fileId);

    socket.on('user:joined', (data: any) => {
      setOnlineReviewers((prev: any[]) => {
        if (prev.find((u: any) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    socket.on('user:left', (data: any) => {
      setOnlineReviewers((prev: any[]) => prev.filter((u: any) => u.userId !== data.userId));
      setRemoteCursors((prev: any) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    socket.on('cursor:moved', (data: any) => {
      setRemoteCursors((prev: any) => ({
        ...prev,
        [data.userId]: { x: data.x, y: data.y },
      }));
    });

    socket.on('comment:new', (comment: any) => {
      setCommentList((prev: any[]) => [...prev, comment]);
    });

    socket.on('annotation:new', (annotation: any) => {
      setAnnotationsList((prev: any[]) => [...prev, annotation]);
    });

    socket.on('player:played', (data: any) => {
      if (!playing) {
        setPlaying(true);
        videoRef.current?.play();
      }
    });

    socket.on('player:paused', (data: any) => {
      if (playing) {
        setPlaying(false);
        videoRef.current?.pause();
      }
    });

    socket.on('player:seeked', (data: any) => {
      if (videoRef.current) {
        videoRef.current.currentTime = data.timecode;
      }
    });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoReady(true);
      setVideoError('');
    }
  };

  const [retryCount, setRetryCount] = useState(0);

  const handleVideoError = async () => {
    const video = videoRef.current;
    let msg = 'Video not available';
    if (video?.error) {
      const codes: Record<number, string> = {
        1: 'Carga de video abortada',
        2: 'Error de red al cargar el video',
        3: 'Formato de video no soportado. Prueba subir un video H.264 (.mp4)',
        4: 'Video no disponible. Prueba subir un video H.264 (.mp4)',
      };
      msg = codes[video.error.code] || 'Error al cargar el video';
    }
    const anyVideo = video as any;
    if (!anyVideo?.videoWidth && anyVideo?.audioTracks?.length) {
      msg = 'El códec de video no es compatible con este navegador. Usa H.264 (.mp4)';
    }
    setVideoError(msg);
    setVideoReady(false);
  };

  const handleRetry = () => {
    setVideoError('');
    setVideoSrc(`/api/files/stream/${params.fileId}?t=${Date.now()}`);
    setRetryCount(c => c + 1);
  };

  const handleWaiting = () => setVideoBuffering(true);
  const handleCanPlay = () => setVideoBuffering(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      socketRef.current?.emit('player:pause', { fileId: params.fileId, timecode: currentTime });
    } else {
      videoRef.current.play();
      socketRef.current?.emit('player:play', { fileId: params.fileId, timecode: currentTime });
    }
    setPlaying(!playing);
  }, [playing, currentTime, params.fileId]);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      socketRef.current?.emit('player:seek', { fileId: params.fileId, timecode: time });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (v === 0) setMuted(true);
    else setMuted(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDrawPath([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentDrawPath.length === 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingMode === 'freehand') {
      setCurrentDrawPath((prev: any) => [...prev, { x, y }]);
      drawPath([...currentDrawPath, { x, y }]);
    } else {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const start = currentDrawPath[0];
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 2;

      if (drawingMode === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        const angle = Math.atan2(y - start.y, x - start.x);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10 * Math.cos(angle - 0.4), y - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(x - 10 * Math.cos(angle + 0.4), y - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = drawColor;
        ctx.fill();
      } else if (drawingMode === 'rectangle') {
        ctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
      }
    }
  };

  const handleCanvasMouseUp = async () => {
    if (currentDrawPath.length === 0) return;

    const pathData = currentDrawPath.length === 1
      ? { type: drawingMode === 'freehand' ? 'point' : drawingMode, x: currentDrawPath[0].x, y: currentDrawPath[0].y }
      : { type: drawingMode, points: currentDrawPath };

    try {
      const annotation = await annotationsApi.create(params.fileId as string, {
        timecode: currentTime,
        type: drawingMode,
        data: pathData,
        color: drawColor,
        stroke_width: 2,
      });
      setAnnotationsList((prev: any[]) => [...prev, annotation]);
      socketRef.current?.emit('annotation:added', { fileId: params.fileId, annotation });

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } catch (err) {
      console.error('Failed to save annotation:', err);
    }

    setCurrentDrawPath([]);
  };

  const drawPath = (points: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length < 2) {
      ctx.fillStyle = drawColor;
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  const loadAnnotationDrawings = () => {
    const canvas = canvasRef.current;
    if (!canvas || !showAnnotations) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const tolerance = 0.05;
    const frameAnnotations = annotationsList.filter(
      (a: any) => Math.abs(a.timecode - currentTime) < tolerance
    );

    frameAnnotations.forEach((ann: any) => {
      const data = typeof ann.data === 'string' ? JSON.parse(ann.data) : ann.data;
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.stroke_width || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (data.points && data.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(data.points[0].x, data.points[0].y);
        for (let i = 1; i < data.points.length; i++) {
          ctx.lineTo(data.points[i].x, data.points[i].y);
        }
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (videoReady) {
      loadAnnotationDrawings();
    }
  }, [currentTime, annotationsList, showAnnotations, videoReady]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await comments.create(params.fileId as string, {
        content: newComment,
        timecode: currentTime,
      });
      setCommentList((prev: any[]) => [...prev, comment]);
      socketRef.current?.emit('comment:added', { fileId: params.fileId, comment });
      setNewComment('');
      toast('Comentario agregado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await comments.resolve(commentId);
      setCommentList((prev: any[]) =>
        prev.map((c: any) =>
          c.id === commentId ? { ...c, status: 'resolved' } : c
        )
      );
      socketRef.current?.emit('comment:resolved', { fileId: params.fileId, commentId });
      toast('Comentario resuelto', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleAddReply = async (commentId: string, content: string) => {
    try {
      const reply = await comments.create(params.fileId as string, {
        content,
        parent_id: commentId,
        timecode: currentTime,
      });
      setCommentList((prev: any[]) =>
        prev.map((c: any) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        )
      );
      socketRef.current?.emit('comment:added', { fileId: params.fileId, comment: reply });
      toast('Respuesta agregada', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleReactToComment = async (commentId: string, emoji: string, isReply?: boolean, replyId?: string) => {
    try {
      const result = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji, isReply, replyId }),
      });
      if (!result.ok) throw new Error('Failed to react');
      const updated = await result.json();
      setCommentList((prev: any[]) =>
        prev.map((c: any) => (c.id === commentId ? updated : c))
      );
    } catch (err: any) {
      console.error('React error:', err);
    }
  };

  const handleSeekTo = (seconds: number) => {
    handleSeek(seconds);
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await annotationsApi.delete(annotationId);
      setAnnotationsList((prev: any[]) => prev.filter((a: any) => a.id !== annotationId));
      socketRef.current?.emit('annotation:removed', { fileId: params.fileId, annotationId });
      toast('Anotación eliminada', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleNewVersionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoFile = e.target.files?.[0];
    if (!videoFile) return;

    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/files/upload/${projectId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      loadFile();
      toast('Nueva versión subida — se está procesando', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderSidebarContent = () => (
    <>
      <div className="flex gap-1 p-2 bg-black/20 border-b border-white/[0.04]">
        {[
          { id: 'comments', label: 'Comentarios', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
          { id: 'annotations', label: 'Notas', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
          { id: 'versions', label: 'Versiones', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
          { id: 'reviews', label: 'Revisiones', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSidebarTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all active:scale-90 ${sidebarTab === tab.id ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sidebarTab === 'comments' && (
          <div className="p-3">
            <div className="glass-panel rounded-xl p-2 mb-3 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder={`Comentar en ${formatTime(currentTime)}...`}
                className="flex-1 px-3 py-2 bg-frame-800/50 border border-frame-700/30 rounded-lg text-white text-xs placeholder-frame-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button onClick={handleAddComment} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.97]">
                Enviar
              </button>
            </div>

            <div className="space-y-2">
              {commentList.filter((c: any) => !c.parent_id).length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-8 h-8 mx-auto text-frame-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-frame-500 text-xs">Sin comentarios aún</p>
                  <p className="text-frame-600 text-[10px] mt-1">Pausa el video y comenta en un frame específico</p>
                </div>
              )}
              {commentList.filter((c: any) => !c.parent_id).map((comment: any) => (
                <div key={comment.id} className={`card-subtle rounded-xl overflow-hidden transition-all ${comment.status === 'resolved' ? 'opacity-50' : ''}`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-[9px] font-medium text-blue-400">{(comment.user_name || 'U')[0]}</span>
                        </div>
                        <span className="text-xs text-frame-300 font-medium">{comment.user_name || 'Usuario'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {comment.timecode !== null && (
                          <button
                            onClick={() => handleSeek(comment.timecode)}
                            className="px-1.5 py-0.5 bg-blue-500/10 rounded text-[10px] text-blue-400 hover:bg-blue-500/20 transition-all font-mono"
                          >
                            {formatTime(comment.timecode)}
                          </button>
                        )}
                        {comment.status === 'active' && (
                          <button onClick={() => handleResolveComment(comment.id)} className="p-1 text-frame-500 hover:text-green-400 transition-colors" title="Resolver">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-frame-500">{formatDate(comment.created_at)}</span>
                      {comment.status === 'resolved' && (
                        <span className="text-[10px] text-green-500/70 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Resuelto
                        </span>
                      )}
                    </div>
                  </div>

                  {comment.replies?.length > 0 && (
                    <div className="border-t border-frame-800/30 bg-frame-950/30 px-3 py-2 space-y-2">
                      {comment.replies?.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                          <div className="w-4 h-4 rounded-full bg-frame-700/50 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[7px] font-medium text-frame-400">{(reply.user_name || 'U')[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-frame-300 font-medium">{reply.user_name || 'Usuario'}</span>
                              {reply.timecode !== null && (
                                <button onClick={() => handleSeek(reply.timecode)} className="text-[9px] text-blue-400/70 hover:text-blue-400 font-mono">{formatTime(reply.timecode)}</button>
                              )}
                            </div>
                            <p className="text-[11px] text-white/80 mt-0.5">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sidebarTab === 'annotations' && (
          <div className="p-3">
            {drawing && (
              <div className="glass-panel rounded-xl p-3 mb-3">
                <p className="text-[10px] text-frame-400 uppercase tracking-wider font-medium mb-2">Modo dibujo</p>
                <div className="flex gap-1 mb-2">
                  {(['freehand', 'arrow', 'rectangle', 'highlight'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDrawingMode(mode)}
                      className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all ${drawingMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-frame-800 text-frame-400 hover:text-frame-200 hover:bg-frame-700'}`}
                    >
                      {mode === 'freehand' ? 'Dibujo' : mode === 'arrow' ? 'Flecha' : mode === 'rectangle' ? 'Rectángulo' : 'Resaltar'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {['#FF0000', '#00FF00', '#3B82F6', '#F59E0B', '#A855F7', '#06B6D4', '#FFFFFF'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setDrawColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${drawColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {annotationsList.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-8 h-8 mx-auto text-frame-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="text-frame-500 text-xs">Sin anotaciones</p>
                  <p className="text-frame-600 text-[10px] mt-1">Activa el modo dibujo para anotar</p>
                </div>
              )}
              {annotationsList.map((ann: any) => (
                <div key={ann.id} className="card-subtle rounded-lg px-3 py-2 flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full ring-2 ring-black/20 shrink-0" style={{ backgroundColor: ann.color }} />
                    <div>
                      <span className="text-[11px] text-frame-300 font-medium capitalize">{ann.type === 'freehand' ? 'Dibujo' : ann.type === 'arrow' ? 'Flecha' : ann.type === 'rectangle' ? 'Rectángulo' : ann.type}</span>
                      <button onClick={() => handleSeek(ann.timecode)} className="text-[10px] text-blue-400/70 hover:text-blue-400 font-mono block transition-colors">
                        {formatTime(ann.timecode)}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAnnotation(ann.id)} className="p-1.5 text-frame-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" title="Eliminar">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sidebarTab === 'versions' && (
          <div className="p-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 glass-panel hover:bg-frame-800/80 text-white rounded-xl text-xs font-medium transition-all active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir nueva versión
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleNewVersionUpload} className="hidden" />

            {(!file.versions || file.versions.length === 0) && (
              <div className="text-center py-12">
                <svg className="w-8 h-8 mx-auto text-frame-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p className="text-frame-500 text-xs">Sin versiones</p>
              </div>
            )}
            <div className="space-y-1.5">
              {file.versions?.map((v: any) => (
                <div key={v.id} className="card-subtle rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">v{v.version_number}</span>
                    </div>
                    <div>
                      <span className="text-xs text-white font-medium">Versión {v.version_number}</span>
                      <div className="text-[10px] text-frame-500 mt-0.5">
                        {v.uploader_name || 'Unknown'} · {formatDate(v.created_at)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-frame-500">{v.duration ? `${Math.round(v.duration)}s` : '--'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sidebarTab === 'reviews' && (
          <CommentsPanel
            comments={commentList.map((c: any) => ({
              id: c.id,
              content: c.content,
              author: c.user_name || 'Usuario',
              created_at: c.created_at,
              resolved: c.status === 'resolved',
              reactions: c.reactions || [],
              replies: (c.replies || []).map((r: any) => ({
                id: r.id,
                content: r.content,
                author: r.user_name || 'Usuario',
                created_at: r.created_at,
                reactions: r.reactions || [],
              })),
              timeline_seconds: c.timecode,
            }))}
            onResolve={handleResolveComment}
            onAddComment={(content) => {
              const fakeEvent = { target: { value: content } } as any;
              const originalValue = newComment;
              setNewComment(content);
              setTimeout(() => {
                handleAddComment();
              }, 0);
            }}
            onAddReply={handleAddReply}
            onReact={handleReactToComment}
            onSeekTo={handleSeekTo}
            currentUser={user?.name || 'You'}
          />
        )}
      </div>
    </>
  );

  if (authLoading || loading) {
    return <LoadingSkeleton type="player" />;
  }

  if (!file) return null;

  return (
    <div className="h-screen bg-frame-950 flex flex-col overflow-hidden">
      <ReviewHeader
        projectName={file.project_name}
        projectId={projectId || undefined}
        fileName={file.original_name}
        duration={duration}
        resolution={file.resolution}
        fps={file.fps}
        reviewers={onlineReviewers}
        drawing={drawing}
        onToggleDrawing={() => setDrawing(!drawing)}
        onBack={() => router.push(`/project/${projectId}`)}
        onShare={async () => {
          setShareLoading(true);
          try {
            const res = await fetch(`/api/share/create/${params.fileId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
              body: '{}',
            });
            const data = await res.json();
            setShareUrl(data.url);
            setShowShareModal(true);
            toast('Link de uso compartido creado', 'success');
          } catch {
            toast('Error al crear link de uso compartido', 'error');
          }
          setShareLoading(false);
        }}
        shareLoading={shareLoading}
        userName={user?.name}
      />
      <div className="md:hidden flex items-center gap-1.5 px-2 py-1.5 bg-frame-900/50 border-b border-white/[0.06] review-header-tools">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap bg-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-90"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Panel
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap bg-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-90"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments
        </button>
        <button
          onClick={() => setDrawing(!drawing)}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all whitespace-nowrap active:scale-90 ${
            drawing ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Annotate
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-black relative review-container" ref={containerRef}>
          <div className="flex-1 relative flex items-center justify-center">
            {fileProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" style={{ borderWidth: '3px' }} />
                <p className="text-white text-sm font-medium">Processing video...</p>
                <p className="text-frame-400 text-xs mt-1">Extracting metadata</p>
              </div>
            )}

            {videoError && !fileProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60">
                <svg className="w-10 h-10 text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-400 text-sm font-medium mb-1">Video not available</p>
                <p className="text-frame-400 text-xs mb-3">{videoError}</p>
                <button onClick={handleRetry} className="px-3 py-1.5 bg-frame-800 hover:bg-frame-700 text-white text-xs rounded-lg transition-colors">
                  Retry
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              className="max-w-full max-h-full outline-none"
              style={{ objectFit: fitMode }}
              src={videoSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onWaiting={handleWaiting}
              onCanPlay={handleCanPlay}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlay}
              preload="auto"
              playsInline
            />

            {videoBuffering && !fileProcessing && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-black/70 rounded-full px-4 py-2 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-xs">Buffering...</span>
                </div>
              </div>
            )}

            {showAnnotations && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ pointerEvents: drawing ? 'auto' : 'none' as any, cursor: drawing ? 'crosshair' : 'default', objectFit: fitMode }}
                onMouseDown={drawing ? handleCanvasMouseDown : undefined}
                onMouseMove={drawing ? handleCanvasMouseMove : undefined}
                onMouseUp={drawing ? handleCanvasMouseUp : undefined}
                onMouseLeave={drawing ? handleCanvasMouseUp : undefined}
              />
            )}

            {Object.entries(remoteCursors).map(([userId, pos]) => (
              <div
                key={userId}
                className="absolute pointer-events-none"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70" />
              </div>
            ))}

            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button onClick={togglePlay} className="w-16 h-16 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors pointer-events-auto">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="review-controls glass-panel rounded-none px-4 py-2 border-t border-frame-700/30">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={togglePlay} className="p-1.5 text-white hover:text-blue-400 transition-all active:scale-90">
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute} className="p-1.5 text-frame-400 hover:text-white transition-all active:scale-90">
                  {muted || volume === 0 ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20"
                />
              </div>

              <span className="text-[11px] text-frame-400 font-mono min-w-[70px] tabular-nums">{formatTime(currentTime)}</span>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <span className="text-[11px] text-frame-500 font-mono tabular-nums">{formatTime(duration)}</span>

              <button
                onClick={() => setFitMode(f => f === 'contain' ? 'cover' : f === 'cover' ? 'fill' : 'contain')}
                className={`p-1.5 transition-all active:scale-90 ${
                  fitMode === 'cover' ? 'text-blue-400' : fitMode === 'fill' ? 'text-frame-200' : 'text-frame-400 hover:text-white'
                }`}
                title={
                  fitMode === 'contain' ? 'Ajustar (contain)' :
                  fitMode === 'cover' ? 'Cubrir (cover)' : 'Llenar (fill)'
                }
              >
                {fitMode === 'contain' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
                {fitMode === 'cover' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
                {fitMode === 'fill' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>

              <button onClick={toggleFullscreen} className="p-1.5 text-frame-400 hover:text-white transition-all active:scale-90">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile bottom panel — appears below controls instead of overlay */}
          <div className={`md:hidden border-t border-white/[0.06] bg-frame-950 overflow-hidden transition-all duration-300 ${
            mobileSidebarOpen ? 'max-h-[50vh]' : 'max-h-0'
          }`}>
            <div className="overflow-y-auto h-full">
              {renderSidebarContent()}
            </div>
          </div>
        </div>

        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex w-80 bg-frame-900/80 backdrop-blur-2xl border-l border-white/[0.06] flex-col shrink-0">
          {renderSidebarContent()}
        </div>
      </div>
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-frame-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-sm font-semibold mb-2">Compartir video</h3>
            <p className="text-frame-400 text-xs mb-4">Cualquier persona con este link puede ver el video y dejar comentarios.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={shareUrl} className="flex-1 px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-xs focus:outline-none" onClick={e => (e.target as HTMLInputElement).select()} />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Link copiado al portapapeles', 'success'); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                Copiar
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-3 text-xs text-frame-500 hover:text-frame-300">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Review() {
  return (
    <AuthProvider>
      <ReviewPage />
    </AuthProvider>
  );
}
