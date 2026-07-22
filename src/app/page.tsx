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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      desc: 'Pausa en cualquier frame, dibuja anotaciones y deja comentarios exactamente donde ocurren, con precisión milimétrica.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Colaboración en Vivo',
      desc: 'Varios revisores ven el mismo video simultáneamente con cursores en tiempo real, comentarios sincronizados y notificaciones instantáneas.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      title: 'Gestión de Versiones',
      desc: 'Sube múltiples versiones, compáralas con tu equipo y mantén todo el historial de cambios sin perder ningún frame.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Flujo de Aprobación',
      desc: 'Define ciclos de revisión, solicita cambios, aprueba versiones y haz seguimiento de todo el proceso con un registro claro y trazable.',
    },
  ];

  const steps = [
    { num: '01', title: 'Sube tu video', desc: 'Carga tu archivo de video en segundos. Soportamos MP4, MOV y los formatos más comunes.' },
    { num: '02', title: 'Compártelo con tu equipo', desc: 'Invita revisores por link o email. Cada uno ve el mismo video sincronizado en tiempo real.' },
    { num: '03', title: 'Revisa y comenta', desc: 'Pausa en cualquier frame, dibuja anotaciones, deja comentarios con timestamp y reacciona con emojis.' },
    { num: '04', title: 'Aprueba y finaliza', desc: 'Resuelve comentarios, marca versiones como aprobadas y exporta el historial completo de la revisión.' },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const openAuth = (mode: 'login' | 'register') => {
    setIsLogin(mode === 'login');
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-frame-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-frame-950/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-8">
              <span className="text-white font-bold text-base sm:text-lg tracking-tight">Video Auditor</span>
              <div className="hidden md:flex items-center gap-6">
                <button onClick={() => scrollTo('features')} className="text-xs text-frame-400 hover:text-white transition-colors">Features</button>
                <button onClick={() => scrollTo('how-it-works')} className="text-xs text-frame-400 hover:text-white transition-colors">Cómo funciona</button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button onClick={() => openAuth('login')} className="px-4 py-2 text-xs font-medium text-frame-300 hover:text-white transition-colors">Iniciar sesión</button>
              <button onClick={() => openAuth('register')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all active:scale-95">Registrarse</button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-frame-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/[0.06] bg-frame-900/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              <button onClick={() => scrollTo('features')} className="w-full text-left px-3 py-2 rounded-lg text-sm text-frame-300 hover:text-white hover:bg-white/5 transition-colors">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="w-full text-left px-3 py-2 rounded-lg text-sm text-frame-300 hover:text-white hover:bg-white/5 transition-colors">Cómo funciona</button>
              <hr className="border-white/[0.06] my-2" />
              <button onClick={() => openAuth('login')} className="w-full text-left px-3 py-2 rounded-lg text-sm text-frame-300 hover:text-white hover:bg-white/5 transition-colors">Iniciar sesión</button>
              <button onClick={() => openAuth('register')} className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-400 font-medium hover:bg-blue-500/10 transition-colors">Registrarse</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[11px] text-blue-400 font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Colaboración en tiempo real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Revisa videos en equipo,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">frame por frame</span>
          </h1>
          <p className="text-frame-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            La plataforma colaborativa de revisión de video que permite a equipos creativos
            compartir, comentar y aprobar contenido audiovisual con precisión de frame y
            cursores en vivo.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button onClick={() => openAuth('register')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              Comenzar gratis
            </button>
            <button onClick={() => scrollTo('how-it-works')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/[0.06]">
              Cómo funciona
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-[11px] sm:text-xs text-frame-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Sin instalación
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Colaboración en vivo
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Frame-accurate
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Todo lo que necesitás para revisar videos</h2>
            <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">Una herramienta completa para que tu equipo colabore en revisiones de video sin fricción.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div key={i} className="group bg-frame-900/60 border border-frame-800/60 rounded-xl p-5 hover:bg-frame-900 hover:border-frame-700/60 transition-all duration-300">
                <div className="text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-frame-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">En 4 pasos</h2>
            <p className="text-frame-400 text-sm sm:text-base">De la carga a la aprobación, sin complicaciones.</p>
          </div>
          <div className="space-y-8 sm:space-y-12">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4 sm:gap-6 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <span className="text-blue-400 font-bold text-sm sm:text-base">{s.num}</span>
                </div>
                <div className="pt-1.5 sm:pt-2">
                  <h3 className="text-white font-semibold text-sm sm:text-base mb-1.5">{s.title}</h3>
                  <p className="text-frame-400 text-xs sm:text-sm leading-relaxed max-w-lg">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free tag */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[11px] text-green-400 font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Completamente gratis
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Sin costo, sin límites</h2>
          <p className="text-frame-400 text-sm sm:text-base mb-6">Video Auditor es y será siempre gratis para tu equipo. Sube videos, invita revisores y colabora sin restricciones.</p>
          <button onClick={() => openAuth('register')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-600/20">
            Empezar ahora
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Listo para probarlo?</h2>
          <p className="text-frame-400 text-sm sm:text-base mb-8">Comienza gratis, sin tarjeta de crédito. En 2 minutos tu equipo ya puede estar revisando videos.</p>
          <button onClick={() => openAuth('register')} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-600/20">
            Crear cuenta gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white font-bold text-sm">Video Auditor</span>
          <p className="text-frame-600 text-xs">© {new Date().getFullYear()} Video Auditor. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[11px] text-frame-500">
            <button onClick={() => scrollTo('features')} className="hover:text-frame-300 transition-colors">Features</button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAuthModal(false)}>
          <div className="w-full max-w-sm bg-frame-900 rounded-2xl p-6 sm:p-7 border border-frame-700/60 shadow-2xl shadow-black/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
                <p className="text-frame-400 text-xs mt-0.5">
                  {isLogin ? 'Accede a tus proyectos' : 'Comienza a revisar videos en equipo'}
                </p>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="p-1.5 text-frame-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-frame-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-frame-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-frame-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-frame-800 border border-frame-700 rounded-lg text-white placeholder-frame-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-frame-400 hover:text-frame-200 transition-colors"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
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
