'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorBoundary } from '@/components/error-boundary';
import BottomNav from '@/components/bottom-nav';
import { projects, files } from '@/lib/api';
import { getSocket } from '@/lib/socket';

function ProjectPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteConfirmFileId, setDeleteConfirmFileId] = useState<string | null>(null);
  const [removeMemberConfirmId, setRemoveMemberConfirmId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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

  useEffect(() => {
    const handleOpenUpload = () => fileInputRef.current?.click();
    window.addEventListener('open-upload', handleOpenUpload);
    return () => window.removeEventListener('open-upload', handleOpenUpload);
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

  const handleUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent.target.files?.[0];
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
    try {
      await files.delete(params.id as string, fileId);
      setDeleteConfirmFileId(null);
      setMenuFileId(null);
      loadProject();
      toast('Archivo eliminado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const loadMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/projects/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setMembers(data.members || []);
    } catch {}
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/projects/${params.id}/members/${inviteEmail}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error al invitar');
      toast('Miembro agregado', 'success');
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/projects/${params.id}/members/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRemoveMemberConfirmId(null);
      toast('Miembro removido', 'success');
      loadMembers();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  if (authLoading || loading) {
    return <LoadingSkeleton type="cards" />;
  }

  if (!project) return null;

  const filteredFiles = project.files?.filter((f: any) =>
    !fileSearch || f.original_name.toLowerCase().includes(fileSearch.toLowerCase())
  ) || [];

  return (
    <>
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
            {/* Desktop: user name */}
            <div className="hidden sm:flex items-center gap-3">
              {onlineUsers.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/5 border border-green-500/10">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-green-400 font-medium">{onlineUsers.length} online</span>
                </div>
              )}
              {project.members && (
                <button
                  onClick={() => { loadMembers(); setShowMembers(true); }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-frame-800/60 text-frame-400 hover:text-frame-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  Miembros
                </button>
              )}
              <span className="text-sm text-frame-400">{user?.name}</span>
            </div>

            {/* Mobile: search + hamburger */}
            <div className="sm:hidden flex items-center gap-1">
              <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="p-1.5 text-frame-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div className="relative">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 text-frame-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-8 w-48 bg-frame-800 border border-frame-700/50 rounded-xl shadow-2xl shadow-black/30 py-1 z-50 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-xs font-medium text-white/80">{user?.name || 'Usuario'}</p>
                      <p className="text-[10px] text-frame-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/profile'); }}
                      className="w-full px-3 py-2 text-left text-xs text-frame-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Perfil
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); logout(); router.push('/'); }}
                      className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </header>

      {mobileSearchOpen && (
        <div className="sm:hidden border-b border-frame-800/50 bg-frame-900/80 px-4 py-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-frame-800/40 border border-frame-700/30 rounded-lg">
            <svg className="w-3.5 h-3.5 text-frame-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
              placeholder="Buscar archivos..."
              className="flex-1 bg-transparent text-xs text-white/70 placeholder-frame-500 focus:outline-none"
              autoFocus
            />
            {fileSearch && (
              <button onClick={() => setFileSearch('')} className="text-frame-500 hover:text-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-semibold text-white">Archivos</h2>
            <p className="text-sm text-frame-500 mt-0.5">{filteredFiles.length} video{filteredFiles.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-frame-800/40 border border-frame-700/30 rounded-lg">
              <svg className="w-3.5 h-3.5 text-frame-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                placeholder="Buscar archivos..."
                className="w-36 bg-transparent text-xs text-white/70 placeholder-frame-500 focus:outline-none"
              />
              {fileSearch && (
                <button onClick={() => setFileSearch('')} className="text-frame-500 hover:text-white">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {uploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-frame-800/50 rounded-lg">
                <div className="w-24 h-1.5 bg-frame-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-[10px] text-frame-400 font-mono">{uploadProgress}%</span>
              </div>
            )}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) setDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); if (!uploading) { const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); } }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] select-none flex items-center gap-2 cursor-pointer ${
                uploading
                  ? 'bg-frame-800 text-frame-400 cursor-not-allowed'
                  : dragOver
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-frame-950'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="truncate">{uploading ? 'Subiendo...' : dragOver ? 'Soltar video' : 'Subir video'}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.wmv"
              onChange={(e) => handleUpload(e)}
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

        {filteredFiles.length === 0 ? (
          <div
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
            className={`text-center py-24 flex flex-col items-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver ? 'border-blue-400 bg-blue-500/5' : 'border-transparent'
            }`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-frame-900/80 border border-frame-800/50 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-frame-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="text-frame-300 text-lg font-medium mb-1">{fileSearch ? 'Sin resultados' : 'Sin archivos'}</p>
            <p className="text-frame-500 text-sm mb-6">{fileSearch ? 'Probá con otro término de búsqueda' : 'Sube un video para empezar a revisar'}</p>
            {!fileSearch && (
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.97]">
                Subir video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFiles.map((file: any) => (
              <div
                key={file.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/review/${file.id}?projectId=${project.id}`)}
              >
                <div className="p-0.5 rounded-2xl bg-gradient-to-b from-frame-700/20 to-transparent transition-all duration-500 group-hover:from-frame-600/30">
                  <div className="bg-frame-950 rounded-xl overflow-hidden border border-frame-800/60 transition-all duration-300 group-hover:border-frame-700/80 group-hover:shadow-lg group-hover:shadow-black/20">
                    <div className="aspect-video bg-frame-900/50 relative flex items-center justify-center overflow-hidden">
                      <img
                        src={`/api/files/thumbnail/${file.id}`}
                        alt={file.original_name}
                        className="w-full h-full object-contain bg-frame-950"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <svg className="absolute w-12 h-12 text-frame-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
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
                            onClick={() => { setDeleteConfirmFileId(file.id); setMenuFileId(null); }}
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
        <BottomNav />
      </div>

      {showMembers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowMembers(false)}>
          <div className="bg-frame-900 rounded-2xl p-5 w-full max-w-sm border border-frame-700/50 shadow-2xl shadow-black/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Miembros</h3>
              <button onClick={() => setShowMembers(false)} className="p-1 text-frame-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleInvite} className="flex gap-2 mb-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email del miembro..."
                className="flex-1 px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-xs text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
              <button
                type="submit"
                disabled={inviteLoading || !inviteEmail.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-frame-700 disabled:text-frame-500 text-white rounded-lg text-xs font-medium transition-all active:scale-95"
              >
                {inviteLoading ? '...' : 'Invitar'}
              </button>
            </form>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {members.length === 0 && <p className="text-xs text-frame-500 text-center py-4">Sin miembros</p>}
              {members.map((m: any) => (
                <div key={m.id || m.userId} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                      <span className="text-[9px] text-white/70 font-medium">{(m.name || m.email || 'U')[0].toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-white/70">{m.name || m.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-frame-500 capitalize">{m.role || 'viewer'}</span>
                    {m.role !== 'owner' && (
                      <button onClick={() => setRemoveMemberConfirmId(m.userId || m.id)} className="p-1 text-frame-600 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {deleteConfirmFileId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteConfirmFileId(null)}>
          <div className="bg-frame-900 rounded-2xl p-6 w-full max-w-sm mx-4 border border-frame-700/50 shadow-2xl shadow-black/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Eliminar archivo</h3>
                <p className="text-xs text-frame-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-xs text-frame-300 mb-6 leading-relaxed">
              ¿Estás seguro de eliminar este archivo y todas sus versiones? Los comentarios y anotaciones también se eliminarán.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmFileId(null)} className="flex-1 px-4 py-2 bg-frame-800 hover:bg-frame-700 text-frame-300 hover:text-white rounded-xl text-xs font-medium transition-all active:scale-95">
                Cancelar
              </button>
              <button onClick={() => handleDeleteFile(deleteConfirmFileId)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition-all active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {removeMemberConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setRemoveMemberConfirmId(null)}>
          <div className="bg-frame-900 rounded-2xl p-6 w-full max-w-sm mx-4 border border-frame-700/50 shadow-2xl shadow-black/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Remover miembro</h3>
                <p className="text-xs text-frame-400 mt-0.5">El miembro perderá acceso al proyecto.</p>
              </div>
            </div>
            <p className="text-xs text-frame-300 mb-6 leading-relaxed">¿Estás seguro de remover este miembro del proyecto? Podrás invitarlo nuevamente más tarde.</p>
            <div className="flex gap-2">
              <button onClick={() => setRemoveMemberConfirmId(null)} className="flex-1 px-4 py-2 bg-frame-800 hover:bg-frame-700 text-frame-300 hover:text-white rounded-xl text-xs font-medium transition-all active:scale-95">Cancelar</button>
              <button onClick={() => handleRemoveMember(removeMemberConfirmId)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition-all active:scale-95">Remover</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Project() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ProjectPage />
      </ErrorBoundary>
    </AuthProvider>
  );
}
