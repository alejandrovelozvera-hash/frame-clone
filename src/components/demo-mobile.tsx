'use client';
import { useEffect, useRef, useState } from 'react';

export default function DemoMobile() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Diseñado para móvil</h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">Revisá videos desde cualquier lugar. La experiencia completa en tu teléfono.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          {/* Phone mockup */}
          <div className="relative w-[240px] h-[500px] rounded-[36px] bg-frame-900 border-[3px] border-frame-700/80 shadow-2xl shadow-black/40 overflow-hidden shrink-0">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

            {/* Screen */}
            <div className="relative w-full h-full bg-frame-950 pt-6 overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 py-1 text-[9px] text-white/50">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
                  <span className="text-[8px]">●●●●○</span>
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-frame-800/40">
                <span className="text-white text-[11px] font-bold">Video Auditor</span>
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-[8px] text-blue-400 font-medium">C</span>
                </div>
              </div>

              {/* Video player area */}
              <div className="relative bg-black h-[170px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
                <div className={`w-10 h-10 rounded-full bg-blue-600/70 flex items-center justify-center transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                {/* Seekbar */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-blue-500 rounded-full transition-all duration-[3000ms]" style={{ width: active ? '65%' : '0%' }} />
                  </div>
                </div>
              </div>

              {/* Bottom nav */}
              <div className="flex items-center justify-around py-2 px-2 bg-frame-900 border-t border-frame-800/40">
                {['Proyectos', 'Subir', 'Perfil'].map((label, i) => (
                  <div key={label} className={`flex flex-col items-center gap-0.5 ${i === 1 ? 'text-blue-400' : 'text-frame-500'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-blue-500/10' : ''}`}>
                      {i === 0 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                        </svg>
                      ) : i === 1 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[8px]">{label}</span>
                  </div>
                ))}
              </div>

              {/* Comment bottom sheet */}
              <div className={`flex-1 px-3 py-2 space-y-2 transition-all duration-700 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-7 bg-frame-800 rounded-lg border border-frame-700/40" />
                  <div className="w-14 h-7 bg-blue-600 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[7px] text-yellow-400 font-medium">M</span>
                  </div>
                  <div className="flex-1 bg-frame-800/50 rounded-lg px-2.5 py-2 border border-frame-800/30">
                    <p className="text-[9px] text-white/70">El movimiento de cámara acá no me convence</p>
                    <span className="text-[7px] text-blue-400/60 font-mono mt-1 block">1:23</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[7px] text-purple-400 font-medium">C</span>
                  </div>
                  <div className="flex-1 bg-frame-800/50 rounded-lg px-2.5 py-2 border border-frame-800/30">
                    <p className="text-[9px] text-white/70">Coincido, hay que rehacer esa parte</p>
                    <span className="text-[7px] text-blue-400/60 font-mono mt-1 block">1:25</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-5 max-w-sm">
            {[
              { title: 'Touch gestures', desc: 'Swipe para seek y volumen. Tap para play/pausa. Dibujá anotaciones con el dedo.' },
              { title: 'Bottom sheet de comentarios', desc: 'Comentarios accesibles desde abajo sin perder de vista el video.' },
              { title: 'Hamburger menu', desc: 'Perfil, cerrar sesión y más opciones en un menú lateral.' },
              { title: 'Drag & drop', desc: 'Subí videos directamente desde tu celular con solo arrastrar.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 transition-all duration-500"
                style={{ opacity: active ? 1 : 0, transform: active ? 'translateY(0)' : 'translateY(10px)', transitionDelay: `${i * 150}ms` }}>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-0.5">{f.title}</h4>
                  <p className="text-frame-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
