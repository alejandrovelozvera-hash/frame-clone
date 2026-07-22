'use client';
import { useEffect, useRef, useState } from 'react';

export default function DemoAnnotations() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Anotaciones frame-accurate</h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">Señalá exactamente lo que necesita cambio con herramientas de dibujo sincronizadas al frame.</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto aspect-[16/9] bg-frame-950 rounded-2xl border border-frame-800/60 overflow-hidden shadow-2xl shadow-black/30">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 h-9 bg-frame-900 border-b border-frame-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <div className="ml-4 flex-1 max-w-[160px] h-5 bg-frame-800/80 rounded-md flex items-center justify-center">
              <span className="text-[9px] text-frame-500 truncate px-2">app.videoauditor.app/review/xyz</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[8px] text-blue-400 font-medium px-2 py-0.5 bg-blue-500/10 rounded">Anotando</span>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-blue-900/10 via-frame-950 to-purple-900/10 h-[calc(100%-36px)]">
            {/* Video frame content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-frame-900/80 border border-frame-800/50 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-frame-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-frame-500 text-xs">Frame 1:23.45 — Pausado</p>
              </div>
            </div>

            {/* Annotation overlays (animated in) */}
            <div className={`absolute inset-0 transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
              {/* Arrow */}
              <svg className="absolute" style={{ top: '30%', left: '25%', animation: active ? 'fadeInUp 0.6s ease-out 0.3s both' : 'none' }} width="110" height="60" viewBox="0 0 110 60" fill="none">
                <path d="M10 50 Q 45 8 90 14" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M90 14 L 100 10 L 96 22 Z" fill="#ef4444" />
              </svg>

              {/* Rectangle */}
              <div className="absolute border-2 border-blue-400 rounded-lg" style={{
                top: '52%', left: '55%', width: '70px', height: '45px',
                animation: active ? 'fadeInUp 0.6s ease-out 0.8s both' : 'none',
              }} />

              {/* Freehand circle */}
              <svg className="absolute" style={{
                top: '20%', right: '20%',
                animation: active ? 'fadeInUp 0.6s ease-out 1.3s both' : 'none',
              }} width="50" height="50" viewBox="0 0 50 50" fill="none">
                <path d="M25 5 C 15 5 5 15 5 25 C 5 35 15 45 25 45 C 35 45 45 35 45 25 C 45 15 35 5 25 5" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M25 15 L 25 25 L 33 30" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>

              {/* Highlight */}
              <div className="absolute bg-yellow-400/20 rounded" style={{
                top: '42%', left: '32%', width: '120px', height: '20px',
                animation: active ? 'fadeInUp 0.6s ease-out 1.8s both' : 'none',
              }} />
            </div>

            {/* Toolbar */}
            <div className={`absolute top-4 right-4 bg-frame-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-frame-700/50 flex flex-col gap-1 transition-all duration-700 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
              style={{ transitionDelay: '2.2s' }}>
              {[
                { id: 'arrow', color: '#ef4444' },
                { id: 'rect', color: '#3b82f6' },
                { id: 'circle', color: '#a855f7' },
                { id: 'highlight', color: '#f59e0b' },
              ].map((tool, i) => (
                <div key={tool.id} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: i === 0 ? `${tool.color}20` : 'transparent' }}>
                  {tool.id === 'arrow' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={tool.color} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  ) : tool.id === 'rect' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={tool.color} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  ) : tool.id === 'circle' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={tool.color} strokeWidth={2}>
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={tool.color} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Color palette */}
            <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '2.6s' }}>
              <div className="flex items-center gap-1.5 bg-frame-800/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/40">
                {['#FF0000', '#3B82F6', '#A855F7', '#F59E0B', '#00FF00', '#06B6D4', '#FFFFFF'].map((c, i) => (
                  <div key={c} className={`w-5 h-5 rounded-full transition-all ${i === 0 ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[10px] text-frame-500 font-mono bg-frame-800/40 px-2 py-1 rounded-lg">1:23.45</span>
            </div>

            {/* Comment attached to annotation */}
            <div className={`absolute bottom-16 right-6 max-w-[160px] bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/50 shadow-xl transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
              style={{ transitionDelay: '3s' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <span className="text-[6px] text-blue-300 font-medium">C</span>
                </div>
                <span className="text-[9px] text-white/70 font-medium">Carlos</span>
              </div>
              <p className="text-[10px] text-white/80 leading-relaxed">El logo debería estar más centrado</p>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-10">
          {[
            { title: 'Multi-herramienta', desc: 'Flechas, rectángulos, dibujo libre y resaltado en un solo clic.' },
            { title: 'Sincronizado al frame', desc: 'Cada anotación queda ligada al timestamp exacto del video.' },
            { title: 'Persistente', desc: 'Tus marcas se guardan y son visibles para todo el equipo.' },
          ].map((f, i) => (
            <div key={i} className="bg-frame-900/50 border border-frame-800/50 rounded-xl p-4 text-center">
              <h4 className="text-white text-xs font-semibold mb-1">{f.title}</h4>
              <p className="text-frame-500 text-[10px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
