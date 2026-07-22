'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { projects } from '@/lib/api';
import { useToast } from '@/components/toast';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import BottomNav from '@/components/bottom-nav';

function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [projectList, setProjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadProjects();
    }
  }, [user, authLoading]);

  const loadProjects = async () => {
    try {
      const data = await projects.list();
      setProjectList(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projectList.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const project = await projects.create({ name: newName, description: newDesc });
      setProjectList([project, ...projectList]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      toast('Proyecto creado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await projects.delete(id);
      setProjectList(projectList.filter(p => p.id !== id));
      toast('Proyecto eliminado', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setNotifications(await res.json());
      } catch {}
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) document.documentElement.classList.toggle('dark', stored === 'true');
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setNotifications((prev: any[]) => prev.map((n: any) => n.id === id ? { ...n, read: 1 } : n));
    } catch {}
  };

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-frame-950 pb-20 lg:pb-0">
      <header className="border-b border-frame-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">Video Auditor</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-frame-400 hover:text-white transition-colors relative"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-8 w-72 bg-frame-800 border border-frame-700/50 rounded-xl shadow-2xl shadow-black/30 py-1 z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-white/[0.06]">
                    <p className="text-[11px] font-medium text-white/70">Notificaciones</p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-frame-500 text-center py-4">Sin notificaciones</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.slice(0, 10).map((n: any) => (
                        <div
                          key={n.id}
                          className={`px-3 py-2 text-xs cursor-pointer transition-colors ${n.read ? 'text-frame-400 hover:bg-white/5' : 'text-white bg-white/[0.03] hover:bg-white/[0.06]'}`}
                          onClick={() => handleMarkRead(n.id)}
                        >
                          <p className={n.read ? '' : 'font-medium'}>{n.message}</p>
                          <p className="text-[10px] text-frame-600 mt-0.5">{new Date(n.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: user name, profile, logout */}
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-sm text-frame-400">{user?.name}</span>
              <button onClick={() => router.push('/profile')} className="text-sm text-frame-400 hover:text-white transition-colors" title="Perfil">Perfil</button>
              <button onClick={() => { logout(); router.push('/'); }} className="text-sm text-frame-400 hover:text-white transition-colors">Cerrar sesión</button>
            </div>

            {/* Mobile: hamburger */}
            <div className="sm:hidden relative">
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
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">Proyectos</h2>
            <p className="text-sm text-frame-500 mt-1">{filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-frame-800/40 border border-frame-700/30 rounded-lg">
              <svg className="w-3.5 h-3.5 text-frame-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar proyectos..."
                className="w-40 bg-transparent text-xs text-white/70 placeholder-frame-500 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-frame-500 hover:text-white">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/storage', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  const data = await res.json();
                  toast(`Espacio usado: ${data.videos.sizeMB}MB en videos, ${data.thumbnails.sizeMB}MB en portadas`, 'info');
                } catch {
                  toast('Error al consultar almacenamiento', 'error');
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-frame-800/60 text-frame-400 hover:text-frame-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              Almacenamiento
            </button>
            <button
              onClick={async () => {
                if (!confirm('¿Eliminar videos subidos hace más de 7 días?')) return;
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/cron/cleanup', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                  });
                  if (!res.ok) throw new Error((await res.json()).error);
                  const data = await res.json();
                  toast(`Eliminados ${data.deleted} archivos (${(data.freed / 1024 / 1024).toFixed(1)}MB liberados)`, 'success');
                  window.location.reload();
                } catch (err: any) {
                  toast('Error al limpiar: ' + err.message, 'error');
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-frame-800/60 text-frame-400 hover:text-red-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Limpiar
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.97] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo proyecto
          </button>
        </div>  {/* closes buttons wrapper */}
        </div>  {/* closes justify-between div */}

        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-frame-900 rounded-2xl p-6 w-full max-w-md border border-frame-700/50 shadow-2xl shadow-black/20" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Crear proyecto</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-frame-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Nombre del proyecto"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-frame-300 mb-1">Descripción</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    rows={3}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-frame-300 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.97]">
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-frame-900/80 border border-frame-800/50 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-frame-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </div>
            <p className="text-frame-300 text-lg font-medium mb-1">{searchQuery ? 'Sin resultados' : 'Sin proyectos'}</p>
            <p className="text-frame-500 text-sm mb-6">{searchQuery ? 'Probá con otro término de búsqueda' : 'Crea tu primer proyecto para empezar a revisar videos'}</p>
            {!searchQuery && (
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.97]">
                Nuevo proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project: any) => (
              <div
                key={project.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <div className="p-0.5 rounded-2xl bg-gradient-to-b from-frame-700/30 to-transparent transition-all duration-500 group-hover:from-frame-600/40">
                  <div className="bg-frame-950 rounded-xl p-5 border border-frame-800/60 transition-all duration-300 group-hover:border-frame-700/80 group-hover:shadow-lg group-hover:shadow-black/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mr-3">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                      </div>
                      <h3 className="text-white font-semibold truncate flex-1 text-sm mt-0.5">{project.name}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="text-frame-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-2 mt-0.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {project.description && (
                      <p className="text-frame-400 text-xs mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-frame-500 pt-2 border-t border-frame-800/30">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        {project.file_count || 0} archivos
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        {project.member_count || 1} miembros
                      </span>
                      <span className="ml-auto text-frame-600">{project.owner_name}</span>
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
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardPage />
    </AuthProvider>
  );
}
