'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { projects, files } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function ProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user && params.id) {
      loadProject();
    }
  }, [user, authLoading, params.id]);

  useEffect(() => {
    if (!user || !params.id) return;

    const socket = getSocket();
    socket.emit('join:project', params.id);

    const handleUserJoined = (data: any) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };

    const handleUserLeft = (data: any) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);

    return () => {
      socket.emit('leave:project', params.id);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
    };
  }, [user, params.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFileId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProject = async () => {
    try {
      const data = await projects.get(params.id as string);
      setProject(data);
    } catch (err: any) {
      toast(err.message, 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = 'Upload failed';
            try {
              const err = JSON.parse(xhr.responseText);
              msg = err.error || msg;
            } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error('Connection error - is the backend running?'));

        xhr.open('POST', `/api/files/upload/${params.id}`);
        const token = localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      loadProject();
      toast('Archivo subido — procesando...', 'success');
    } catch (err: any) {
      setUploadError(err.message);
      toast(err.message, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('¿Eliminar este archivo y todas sus versiones?')) return;
    try {
      await files.delete(params.id as string, fileId);
      setMenuFileId(null);
      loadProject();
      toast('Archivo eliminado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-frame-950 flex items-center justify-center">
        <div className="text-frame-400">Loading...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-frame-950">
      <header className="border-b border-frame-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-1.5 text-frame-400 hover:text-white transition-all hover:-translate-x-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">{project.name}</h1>
            {project.description && (
              <span className="text-frame-500 text-sm hidden md:inline border-l border-frame-700/50 pl-4">{project.description}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/5 border border-green-500/10">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-green-400 font-medium">{onlineUsers.length} online</span>
              </div>
            )}
            <span className="text-sm text-frame-400">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-semibold text-white">Archivos</h2>
            <p className="text-sm text-frame-500 mt-0.5">{project.files?.length || 0} video{(project.files?.length || 0) !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            {uploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-frame-800/50 rounded-lg">
                <div className="w-24 h-1.5 bg-frame-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-[10px] text-frame-400 font-mono">{uploadProgress}%</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {uploading ? 'Subiendo...' : 'Subir video'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.wmv"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        {uploadError && (
          <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-400 text-sm">{uploadError}</span>
            </div>
            <button onClick={() => setUploadError('')} className="text-red-400 hover:text-red-300 text-sm font-medium">Cerrar</button>
          </div>
        )}

        {project.files?.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-12 h-12 mx-auto text-frame-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-frame-400 text-lg font-medium mb-1">Sin archivos</p>
            <p className="text-frame-600 text-sm">Subí un video para empezar a revisar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {project.files?.map((file: any) => (
              <div
                key={file.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/review/${file.id}?projectId=${project.id}`)}
              >
                <div className="p-0.5 rounded-2xl bg-gradient-to-b from-frame-700/20 to-transparent transition-all duration-500 group-hover:from-frame-600/30">
                  <div className="bg-frame-950 rounded-xl overflow-hidden border border-frame-800/60 transition-all duration-300 group-hover:border-frame-700/80 group-hover:shadow-lg group-hover:shadow-black/20">
                    <div className="aspect-video bg-frame-900/50 relative flex items-center justify-center">
                      {file.thumbnail_path ? (
                        <img
                          src={`/${file.thumbnail_path.replace(/\\/g, '/')}`}
                          alt={file.original_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <svg className="w-12 h-12 text-frame-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      {file.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-white text-[10px] font-medium">Procesando...</span>
                          </div>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            <span className="text-red-400 text-[10px]">Error</span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFileId(menuFileId === file.id ? null : file.id);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {menuFileId === file.id && (
                        <div
                          ref={menuRef}
                          className="absolute top-10 right-2 bg-frame-800 border border-frame-700/50 rounded-xl shadow-2xl shadow-black/30 py-1 z-20 w-40 backdrop-blur-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => router.push(`/review/${file.id}?projectId=${project.id}`)}
                            className="w-full px-3 py-2 text-left text-xs text-frame-200 hover:bg-frame-700/50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Abrir y revisar
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-frame-700/50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-xs font-medium truncate">{file.original_name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2 text-[10px] text-frame-500">
                          <span>{file.duration ? `${Math.round(file.duration)}s` : '--'}</span>
                          {file.status === 'processing' && (
                            <span className="text-blue-400/70 flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                              Procesando
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-frame-600">{file.uploader_name || 'Desconocido'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Project() {
  return (
    <AuthProvider>
      <ProjectPage />
    </AuthProvider>
  );
}
