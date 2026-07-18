'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { projects } from '@/lib/api';

function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [projectList, setProjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const project = await projects.create({ name: newName, description: newDesc });
      setProjectList([project, ...projectList]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await projects.delete(id);
      setProjectList(projectList.filter(p => p.id !== id));
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

  return (
    <div className="min-h-screen bg-frame-950">
      <header className="border-b border-frame-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">FrameClone</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-frame-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-frame-400 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">Proyectos</h2>
            <p className="text-sm text-frame-500 mt-1">{projectList.length} proyecto{projectList.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.97] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo proyecto
          </button>
        </div>

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

        {projectList.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-12 h-12 mx-auto text-frame-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <p className="text-frame-400 text-lg font-medium mb-1">Sin proyectos</p>
            <p className="text-frame-600 text-sm">Creá tu primer proyecto para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectList.map((project: any) => (
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
