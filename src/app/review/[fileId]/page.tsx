'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { files, comments, annotations as annotationsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

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

      const annots = await annotationsApi.list(params.fileId as string);
      setAnnotationsList(annots);

      if (data.status === 'processing') {
        setTimeout(loadFile, 3000);
      }
    } catch (err: any) {
      alert(err.message);
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
        3: 'Formato de video no soportado. Probá subir un video H.264 (.mp4)',
        4: 'Video no disponible. Probá subir un video H.264 (.mp4)',
      };
      msg = codes[video.error.code] || 'Error al cargar el video';
    }
    if (!video?.videoWidth && video?.audioTracks?.length) {
      msg = 'El códec de video no es compatible con este navegador. Usá H.264 (.mp4)';
    }
    setVideoError(msg);
    setVideoReady(false);
  };

  const handleRetry = () => {
    setVideoError('');
    setRetryCount(c => c + 1);
    if (videoRef.current) {
      videoRef.current.load();
    }
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
      setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

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
    } catch (err: any) {
      alert(err.message);
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await annotationsApi.delete(annotationId);
      setAnnotationsList((prev: any[]) => prev.filter((a: any) => a.id !== annotationId));
      socketRef.current?.emit('annotation:removed', { fileId: params.fileId, annotationId });
    } catch (err: any) {
      alert(err.message);
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-frame-950 flex items-center justify-center">
        <div className="text-frame-400">Loading...</div>
      </div>
    );
  }

  if (!file) return null;

  const streamUrl = `/api/files/stream/${params.fileId}`;

  return (
    <div className="h-screen bg-frame-950 flex flex-col overflow-hidden">
      <header className="review-header bg-frame-900 border-b border-frame-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/project/${projectId}`)} className="text-frame-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-semibold text-sm truncate max-w-md">{file.original_name}</h1>
          <span className="text-xs text-frame-500">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          {onlineReviewers.map((r: any, i: number) => (
            <span key={r.userId || i} className="text-xs text-frame-400">{r.userEmail || 'User'}</span>
          ))}
          <button
            onClick={async () => {
              setShareLoading(true);
              try {
                const res = await fetch(`/api/share/create/${params.fileId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: '{}' });
                const data = await res.json();
                setShareUrl(data.url);
                setShowShareModal(true);
              } catch {}
              setShareLoading(false);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-frame-800 text-frame-300 hover:text-white"
          >
            {shareLoading ? '...' : 'Share'}
          </button>
          <button
            onClick={() => setDrawing(!drawing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${drawing ? 'bg-blue-600 text-white' : 'bg-frame-800 text-frame-300 hover:text-white'}`}
          >
            Annotate
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden px-2 py-1.5 rounded-lg text-xs font-medium bg-frame-800 text-frame-300 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showComments ? 'bg-frame-800 text-white' : 'bg-frame-800 text-frame-400 hover:text-white'}`}
          >
            Comments
          </button>
          <span className="text-xs text-frame-500">{user?.name}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-black relative" ref={containerRef}>
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
              src={streamUrl}
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
                style={{ pointerEvents: drawing ? 'auto' : 'none' as any, cursor: drawing ? 'crosshair' : 'default' }}
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

          <div className="review-controls bg-frame-900 px-4 py-2 border-t border-frame-800">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-frame-400 hover:text-white transition-colors">
                  {muted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 accent-blue-500"
                />
              </div>

              <span className="text-xs text-frame-400 font-mono min-w-[80px]">{formatTime(currentTime)}</span>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1 accent-blue-500 cursor-pointer"
                />
              </div>

              <span className="text-xs text-frame-500 font-mono">{formatTime(duration)}</span>

              <button onClick={toggleFullscreen} className="text-frame-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileSidebarOpen(false)} />
        )}
        <div className={`review-sidebar ${mobileSidebarOpen ? 'open' : ''} w-80 bg-frame-900 border-l border-frame-800 flex flex-col shrink-0`}>
          <div className="flex border-b border-frame-800">
            {(['comments', 'annotations', 'versions', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${sidebarTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-frame-500 hover:text-frame-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sidebarTab === 'comments' && (
              <div className="p-3">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder={`Comment at ${formatTime(currentTime)}...`}
                    className="flex-1 px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-xs placeholder-frame-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={handleAddComment} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                    Post
                  </button>
                </div>

                <div className="space-y-2">
                  {commentList.filter((c: any) => !c.parent_id).map((comment: any) => (
                    <div key={comment.id} className={`p-3 rounded-lg ${comment.status === 'resolved' ? 'bg-frame-800/50 opacity-60' : 'bg-frame-800'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-frame-400 font-medium">{comment.user_name || 'User'}</span>
                        <div className="flex items-center gap-2">
                          {comment.timecode !== null && (
                            <button
                              onClick={() => handleSeek(comment.timecode)}
                              className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                            >
                              {formatTime(comment.timecode)}
                            </button>
                          )}
                          {comment.status === 'active' && (
                            <button onClick={() => handleResolveComment(comment.id)} className="text-xs text-frame-500 hover:text-green-400">
                              resolve
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-white">{comment.content}</p>
                      {comment.status === 'resolved' && (
                        <span className="text-xs text-green-500 mt-1 block">Resolved</span>
                      )}
                      <span className="text-xs text-frame-600 mt-1 block">{formatDate(comment.created_at)}</span>

                      {comment.replies?.map((reply: any) => (
                        <div key={reply.id} className="ml-4 mt-2 p-2 bg-frame-900 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-frame-400">{reply.user_name || 'User'}</span>
                            {reply.timecode !== null && (
                              <button onClick={() => handleSeek(reply.timecode)} className="text-xs text-blue-400 hover:text-blue-300 font-mono">{formatTime(reply.timecode)}</button>
                            )}
                          </div>
                          <p className="text-xs text-white">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === 'annotations' && (
              <div className="p-3">
                {drawing && (
                  <div className="mb-3 p-3 bg-frame-800 rounded-lg">
                    <p className="text-xs text-frame-300 mb-2">Drawing mode active</p>
                    <div className="flex gap-1 mb-2">
                      {(['freehand', 'arrow', 'rectangle', 'highlight'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setDrawingMode(mode)}
                          className={`px-2 py-1 text-xs rounded ${drawingMode === mode ? 'bg-blue-600 text-white' : 'bg-frame-700 text-frame-300'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setDrawColor(color)}
                          className={`w-5 h-5 rounded-full ${drawColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-frame-800' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {annotationsList.map((ann: any) => (
                    <div key={ann.id} className="p-2 bg-frame-800 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ann.color }} />
                          <span className="text-xs text-frame-300">{ann.type}</span>
                        </div>
                        <button onClick={() => handleSeek(ann.timecode)} className="text-xs text-blue-400 font-mono mt-1 block">
                          {formatTime(ann.timecode)}
                        </button>
                      </div>
                      <button onClick={() => handleDeleteAnnotation(ann.id)} className="text-frame-500 hover:text-red-400 text-xs">
                        delete
                      </button>
                    </div>
                  ))}
                  {annotationsList.length === 0 && (
                    <p className="text-xs text-frame-500 text-center py-8">No annotations yet</p>
                  )}
                </div>
              </div>
            )}

            {sidebarTab === 'versions' && (
              <div className="p-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-frame-800 hover:bg-frame-700 text-white rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Upload New Version
                </button>
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleNewVersionUpload} className="hidden" />

                <div className="space-y-2">
                  {file.versions?.map((v: any) => (
                    <div key={v.id} className="p-3 bg-frame-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-medium">v{v.version_number}</span>
                        <span className="text-xs text-frame-500">{v.duration ? `${Math.round(v.duration)}s` : '--'}</span>
                      </div>
                      <div className="text-xs text-frame-500 mt-1">
                        {v.uploader_name || 'Unknown'} &middot; {formatDate(v.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === 'reviews' && (
              <div className="p-3">
                <p className="text-xs text-frame-400 mb-3">Review workflow</p>
                <div className="space-y-2">
                  {commentList
                    .filter((c: any) => c.status === 'active')
                    .map((c: any) => (
                      <div key={c.id} className="p-2 bg-frame-800 rounded-lg">
                        <p className="text-xs text-white truncate">{c.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleResolveComment(c.id)}
                            className="text-xs text-green-500 hover:text-green-400"
                          >
                            Approve
                          </button>
                          <button className="text-xs text-red-500 hover:text-red-400">Request Changes</button>
                        </div>
                      </div>
                    ))}
                  {commentList.filter((c: any) => c.status === 'active').length === 0 && (
                    <p className="text-xs text-frame-500 text-center py-4">No pending items</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-frame-900 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-sm font-semibold mb-2">Compartir video</h3>
            <p className="text-frame-400 text-xs mb-4">Cualquier persona con este link puede ver el video y dejar comentarios.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={shareUrl} className="flex-1 px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-xs focus:outline-none" onClick={e => (e.target as HTMLInputElement).select()} />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
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
