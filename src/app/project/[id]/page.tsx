'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { projects, files } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function ProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
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
      alert(err.message);
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
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file and all its versions?')) return;
    try {
      await files.delete(params.id as string, fileId);
      setMenuFileId(null);
      loadProject();
    } catch (err: any) {
      alert(err.message);
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
      <header className="border-b border-frame-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-frame-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <span className="text-frame-500 text-sm hidden md:inline">{project.description}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-xs text-frame-400">{onlineUsers.length} online</span>
              </div>
            )}
            <span className="text-sm text-frame-400">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Files</h2>
          <div className="flex items-center gap-3">
            {uploading && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-frame-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-xs text-frame-400">{uploadProgress}%</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
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
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-red-400 text-sm">{uploadError}</span>
            <button onClick={() => setUploadError('')} className="text-red-400 hover:text-red-300 text-sm font-medium">Dismiss</button>
          </div>
        )}

        {project.files?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-frame-500 text-lg mb-2">No files yet</p>
            <p className="text-frame-600 text-sm">Upload a video to start reviewing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {project.files?.map((file: any) => (
              <div
                key={file.id}
                className="bg-frame-900 border border-frame-800 rounded-xl overflow-hidden hover:border-frame-700 transition-colors cursor-pointer group"
                onClick={() => router.push(`/review/${file.id}?projectId=${project.id}`)}
              >
                <div className="aspect-video bg-frame-800 relative flex items-center justify-center">
                  {file.thumbnail_path ? (
                    <img
                      src={`/${file.thumbnail_path.replace(/\\/g, '/')}`}
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <svg className="w-12 h-12 text-frame-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>

                  {file.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-xs">Processing...</span>
                      </div>
                    </div>
                  )}
                  {file.status === 'failed' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-red-400 text-xs">Upload failed</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuFileId(menuFileId === file.id ? null : file.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {menuFileId === file.id && (
                    <div
                      ref={menuRef}
                      className="absolute top-10 right-2 bg-frame-800 border border-frame-700 rounded-lg shadow-xl py-1 z-20 w-36"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => router.push(`/review/${file.id}?projectId=${project.id}`)}
                        className="w-full px-3 py-2 text-left text-xs text-frame-200 hover:bg-frame-700 flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Open & Review
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-frame-700 flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white text-sm truncate font-medium">{file.original_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-frame-500">
                      {file.duration ? `${Math.round(file.duration)}s` : '--'}
                    </span>
                    <span className="text-xs text-frame-600">{file.uploader_name || 'Unknown'}</span>
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
