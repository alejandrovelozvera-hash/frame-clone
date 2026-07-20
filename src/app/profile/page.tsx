'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error al guardar');
      toast('Perfil actualizado', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-frame-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-frame-950">
      <header className="border-b border-frame-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-1.5 text-frame-400 hover:text-white transition-all hover:-translate-x-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Perfil</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-frame-900/60 border border-frame-800/60 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center">
              <span className="text-lg font-bold text-white/70">{(user?.name || 'U')[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">{user?.name}</h2>
              <p className="text-sm text-frame-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-frame-300 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-frame-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                className="w-full px-3 py-2 bg-frame-800/50 border border-frame-700 rounded-lg text-frame-400 text-sm cursor-not-allowed"
                disabled
              />
              <p className="text-[10px] text-frame-600 mt-1">El email no se puede cambiar</p>
            </div>
            <hr className="border-white/[0.06]" />
            <p className="text-xs text-frame-400 font-medium">Cambiar contraseña</p>
            <div>
              <label className="block text-xs font-medium text-frame-300 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-frame-300 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-frame-800 border border-frame-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>
  );
}
