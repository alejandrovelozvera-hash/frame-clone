'use client';
import { useEffect, useState } from 'react';

export default function HeroAnimated({ onCta }: { onCta: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 5), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[11px] text-blue-400 font-medium mb-6 animate-pulse">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Colaboración en tiempo real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Revisa videos en equipo,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">frame por frame</span>
          </h1>
          <p className="text-frame-400 text-sm sm:text-base lg:text-lg max-w-lg leading-relaxed mb-8">
            Plataforma colaborativa para que equipos creativos compartan, comenten y aprueben contenido audiovisual con precisión de frame y cursores en vivo.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onCta} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              Comenzar gratis
            </button>
            <a href="#how-it-works" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/[0.06]">
              Cómo funciona
            </a>
          </div>
        </div>

        {/* Animated player mockup */}
        <div className="relative w-full aspect-[4/3] bg-frame-950 rounded-2xl border border-frame-800/60 overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center gap-1.5 px-4 h-8 bg-frame-900 border-b border-frame-800/60">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>

          <div className="relative bg-gradient-to-br from-blue-900/20 via-frame-950 to-purple-900/20 h-[calc(100%-32px)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />

            {/* Animated equalizer */}
            {phase !== 3 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-12">
                {[6,10,5,14,8,16,6,12,7,9].map((h,i) => (
                  <div key={i} className="w-[3px] bg-blue-500/30 rounded-t-sm"
                    style={{ height: `${h}px`, animation: `pulse 0.8s ease-in-out infinite ${i*80}ms` }} />
                ))}
              </div>
            )}

            {/* Play button */}
            {phase !== 2 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-blue-600/80 flex items-center justify-center shadow-lg shadow-blue-600/20"
                style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
            )}

            {/* Phase-based overlays */}
            {phase === 0 && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between transition-all duration-500"
                style={{ opacity: 1, transform: 'translateY(0)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 font-mono">1:23</span>
                  <div className="w-24 h-1 bg-white/10 rounded-full"><div className="h-full w-1/3 bg-blue-500 rounded-full" /></div>
                  <span className="text-[9px] text-white/40 font-mono">3:45</span>
                </div>
                <span className="text-[9px] text-green-400/70 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />3 online</span>
              </div>
            )}

            {phase === 1 && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
                <div className="bg-frame-800/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-frame-700/50 max-w-[200px] shadow-xl"
                  style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center"><span className="text-[7px] text-purple-300 font-medium">M</span></div>
                    <span className="text-[9px] text-white/70 font-medium">María</span>
                    <span className="text-[8px] text-frame-500 ml-auto">0:45</span>
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed">La iluminación en esta escena queda muy bien 💡</p>
                </div>
              </div>
            )}

            {phase === 2 && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
                <svg className="absolute" style={{ top: '35%', left: '40%', animation: 'fadeInUp 0.5s ease-out' }} width="80" height="50" viewBox="0 0 80 50" fill="none">
                  <path d="M8 42 Q 32 8 64 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M64 12 L 72 9 L 68 18 Z" fill="#ef4444" />
                </svg>
                <div className="absolute" style={{ top: '55%', left: '55%', width: '48px', height: '32px', border: '2px solid #3b82f6', borderRadius: '4px', animation: 'fadeInUp 0.5s ease-out 0.2s both' }} />
              </div>
            )}

            {phase === 3 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 transition-all duration-500"
                style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="w-2 h-2 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[10px] text-frame-400 ml-1">Carlos está escribiendo...</span>
              </div>
            )}

            {phase === 4 && (
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-500"
                style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="bg-frame-800/80 backdrop-blur-sm rounded-xl p-4 border border-frame-700/50 max-w-[220px] text-center shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <h4 className="text-white text-xs font-semibold">Revisión aprobada</h4>
                  <p className="text-frame-400 text-[10px] mt-0.5">3 comentarios resueltos</p>
                </div>
              </div>
            )}

            {/* Cursors */}
            {[1, 3].includes(phase) && (
              <div className="absolute w-3 h-3 bg-yellow-400 rounded-full opacity-80 transition-all duration-700"
                style={{ left: phase === 1 ? '75%' : '30%', top: phase === 1 ? '30%' : '50%' }}>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-yellow-400 whitespace-nowrap">María</span>
              </div>
            )}
            {phase === 3 && (
              <div className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-80 transition-all duration-700"
                style={{ left: '60%', top: '45%' }}>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-purple-400 whitespace-nowrap">Carlos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
