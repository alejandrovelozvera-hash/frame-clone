'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Frame-Accurate Review',
      desc: 'Pausa en cualquier frame, dibuja anotaciones y deja comentarios exactamente donde ocurren.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Colaboración en Tiempo Real',
      desc: 'Varios revisores ven el mismo video simultáneamente con cursores en vivo y comentarios sincronizados.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      title: 'Gestión de Versiones',
      desc: 'Sube múltiples versiones del mismo video y compáralas con tu equipo manteniendo todo el historial.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Flujo de Aprobación',
      desc: 'Define revisiones, solicita cambios y aprueba versiones con un flujo claro y trazable.',
    },
  ];

  return (
    <div className="min-h-screen bg-frame-950 flex flex-col lg:flex-row">
      {/* Auth card — TOP on mobile, RIGHT on desktop */}
      <div className="order-first lg:order-last w-full lg:w-[420px] lg:min-h-screen flex items-start lg:items-center justify-center px-4 pt-4 pb-0 lg:px-8 lg:py-0">
        <div className="w-full bg-frame-900/80 backdrop-blur-xl lg:bg-frame-900 rounded-2xl lg:rounded-2xl p-5 lg:p-8 border border-frame-800/60 lg:border-frame-800 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between lg:block mb-4 lg:mb-6">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white">{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
              <p className="text-frame-400 text-xs lg:text-sm mt-0.5 lg:mt-1">
                {isLogin ? 'Accede a tus proyectos' : 'Comienza a revisar videos en equipo'}
              </p>
            </div>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="lg:hidden text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap ml-3"
            >
              {isLogin ? 'Registrarse' : 'Iniciar sesión'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-xs lg:text-sm font-medium text-frame-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs lg:text-sm font-medium text-frame-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs lg:text-sm font-medium text-frame-300 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 lg:mt-5 text-center hidden lg:block">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-frame-400 hover:text-frame-200 transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* Hero section — BELOW auth on mobile, LEFT on desktop */}
      <div className="order-last lg:order-first flex-1 flex flex-col justify-center px-6 lg:px-16 py-6 lg:py-0">
        <div className="max-w-xl">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Revisa videos en equipo,
              <span className="text-blue-500"> frame por frame</span>
            </h1>
            <p className="text-frame-400 text-sm lg:text-lg mt-3 lg:mt-4 leading-relaxed">
              La plataforma colaborativa de revisión de video que permite a equipos creativos
              compartir, comentar y aprobar contenido audiovisual con precisión de frame.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {features.map((f, i) => (
              <div key={i} className="bg-frame-900/50 border border-frame-800 rounded-xl p-3 lg:p-4 hover:bg-frame-900 transition-colors">
                <div className="text-blue-500 mb-1.5 lg:mb-2">{f.icon}</div>
                <h3 className="text-white font-semibold text-xs lg:text-sm mb-1">{f.title}</h3>
                <p className="text-frame-500 text-[11px] lg:text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 lg:gap-6 text-[11px] lg:text-xs text-frame-600">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Sin instalación
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Colaboración en vivo
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Frame-accurate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
