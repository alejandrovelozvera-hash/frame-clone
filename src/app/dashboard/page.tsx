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
      <header className="border-b border-frame-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">FrameClone</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-frame-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-frame-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Projects</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            New Project
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-frame-900 rounded-xl p-6 w-full max-w-md border border-frame-800" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Create Project</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-frame-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-frame-300 mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-frame-300 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {projectList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-frame-500 text-lg mb-2">No projects yet</p>
            <p className="text-frame-600 text-sm">Create your first project to start reviewing videos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectList.map((project: any) => (
              <div
                key={project.id}
                className="bg-frame-900 border border-frame-800 rounded-xl p-5 hover:border-frame-700 transition-colors cursor-pointer group"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold truncate flex-1">{project.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                    className="text-frame-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {project.description && (
                  <p className="text-frame-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-frame-500">
                  <span>{project.file_count || 0} files</span>
                  <span>{project.member_count || 1} members</span>
                  <span className="ml-auto">{project.owner_name}</span>
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
