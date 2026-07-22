'use client';
import { useEffect, useRef, useState } from 'react';

export default function DemoVersions() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Comparación de versiones</h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">Subí nuevas versiones y comparalas lado a lado con el equipo sin perder contexto.</p>
        </div>

        <div className="relative w-full max-w-3xl mx-auto bg-frame-950 rounded-2xl border border-frame-800/60 overflow-hidden shadow-2xl shadow-black/30">
          <div className="flex items-center gap-1.5 px-4 h-9 bg-frame-900 border-b border-frame-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <div className="ml-4 flex items-center gap-3">
              {['V1 — Original', 'V2 — Corregida'].map((v, i) => (
                <div key={v} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] ${i === 0 ? 'bg-frame-800/50 text-frame-400' : 'bg-blue-500/15 text-blue-400 font-medium'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-frame-600' : 'bg-blue-400'}`} />
                  {v}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-frame-800/60">
            {/* V1 */}
            <div className="relative aspect-video bg-gradient-to-br from-blue-900/10 via-frame-950 to-purple-900/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-frame-900/80 border border-frame-800/50 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-frame-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-frame-500 text-[10px]">V1 — Original</p>
              </div>

              {/* Annotations on V1 */}
              <div className={`absolute inset-0 transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
                <svg className="absolute" style={{ top: '40%', left: '30%' }} width="60" height="40" viewBox="0 0 60 40" fill="none">
                  <path d="M5 32 Q 25 5 50 10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M50 10 L 56 8 L 54 16 Z" fill="#ef4444" />
                </svg>
                <div className="absolute top-3 left-3 bg-red-500/10 text-red-400 text-[8px] font-medium px-1.5 py-0.5 rounded">2 issues</div>
              </div>
            </div>

            {/* V2 */}
            <div className="relative aspect-video bg-gradient-to-br from-green-900/10 via-frame-950 to-blue-900/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-green-400/70 text-[10px] font-medium">V2 — Corregida</p>
              </div>

              <div className={`absolute inset-0 transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-3 left-3 bg-green-500/10 text-green-400 text-[8px] font-medium px-1.5 py-0.5 rounded">Resuelto</div>

                {/* Resolution comment */}
                <div className="absolute bottom-12 right-3 max-w-[140px] transition-all duration-700" style={{ animation: active ? 'fadeInUp 0.6s ease-out 0.5s both' : 'none' }}>
                  <div className="bg-frame-800/90 backdrop-blur-sm rounded-xl px-2 py-1.5 border border-frame-700/50 shadow-xl">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[7px] text-green-400">✓</span>
                      <span className="text-[8px] text-white/60">Corregido en V2</span>
                    </div>
                    <p className="text-[8px] text-white/70 leading-relaxed">Movimiento de cámara ajustado, audio resync</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Version timeline */}
          <div className="px-4 py-3 bg-frame-900/50 border-t border-frame-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-frame-400">V2 — hoy</span>
                </div>
                <span className="text-[10px] text-frame-600">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-frame-600" />
                  <span className="text-[10px] text-frame-500">V1 — ayer</span>
                </div>
              </div>
              <span className="text-[9px] text-frame-500">3 comentarios resueltos entre versiones</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[
                { v: 'V1', color: 'bg-frame-700' },
                { v: 'V1→V2', color: 'bg-blue-500', label: 'Corrección cámara', resolved: true },
                { v: 'V1→V2', color: 'bg-blue-500', label: 'Ajuste audio', resolved: true },
                { v: 'V1→V2', color: 'bg-blue-500', label: 'Color grading', resolved: true },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] ${item.resolved ? 'bg-green-500/10 text-green-400' : 'bg-frame-800/50 text-frame-500'}`}>
                  {item.resolved && <span className="text-[7px]">✓</span>}
                  {item.label || item.v}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
