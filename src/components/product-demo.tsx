'use client';
import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    title: 'Subí tu video',
    desc: 'MP4, MOV, WebM — arrastrá y soltá. El video se optimiza automáticamente para streaming rápido.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    title: 'Comentá en cualquier frame',
    desc: 'Pausá, señalá con el mouse o el dedo, y dejá un comentario con timestamp exacto.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Dibujá anotaciones',
    desc: 'Flechas, rectángulos, dibujo libre. Tus marcas quedan sincronizadas con el frame exacto.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
  },
  {
    title: 'Aprobá y compartí',
    desc: 'Resolvé comentarios, compartí un link público para revisores externos y cerrá la revisión.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

function StepCard({ step, index, visible }: { step: typeof steps[0]; index: number; visible: boolean }) {
  return (
    <div
      className={`flex items-start gap-4 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
        {step.icon}
      </div>
      <div className="pt-1">
        <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
        <p className="text-frame-400 text-xs leading-relaxed max-w-sm">{step.desc}</p>
      </div>
    </div>
  );
}

export default function ProductDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Así funciona
          </h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">
            Cuatro pasos simples para revisar videos con tu equipo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} visible={visible} />
            ))}
          </div>

          <div className="relative w-full aspect-[16/10] bg-frame-950 rounded-2xl border border-frame-800/60 overflow-hidden shadow-2xl shadow-black/30">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 h-9 bg-frame-900 border-b border-frame-800/60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <div className="ml-4 flex-1 max-w-[180px] h-5 bg-frame-800/80 rounded-md flex items-center justify-center">
                <span className="text-[9px] text-frame-500 truncate px-2">app.videoauditor.app/project/abc</span>
              </div>
            </div>

            {/* Video player mockup */}
            <div className="relative bg-black h-[calc(100%-36px)] flex items-center justify-center overflow-hidden">
              {/* Animated video background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-frame-950 to-purple-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-frame-950/60 to-transparent" />
              </div>

              {/* Equalizer bars animation */}
              <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-40">
                {[8, 12, 6, 16, 10, 18, 7, 14, 9, 11, 5, 15].map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-blue-500/40 rounded-full animate-demo-equalizer"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.12}s`,
                      animationDuration: '0.9s',
                    }}
                  />
                ))}
              </div>

              {/* Play button (centered, fades) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-blue-600/90 flex items-center justify-center animate-demo-play-btn shadow-lg shadow-blue-600/20">
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>

              {/* Control bar */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent animate-demo-controls">
                <div className="h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <div className="h-full w-2/3 bg-blue-500 rounded-full animate-demo-seek" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">1:23 / 3:45</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-green-400/70 font-medium">2 online</span>
                  </div>
                </div>
              </div>

              {/* Annotation arrow */}
              <svg className="absolute top-1/4 left-1/3 w-24 h-16 opacity-0 animate-demo-annotation" viewBox="0 0 100 60" fill="none">
                <path d="M10 50 Q 40 10 80 15" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M80 15 L 90 12 L 85 22 Z" fill="#ef4444" />
              </svg>

              {/* Comment bubble */}
              <div className="absolute top-8 right-6 max-w-[180px] bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/50 shadow-xl opacity-0 animate-demo-comment">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <span className="text-[7px] text-blue-300 font-medium">C</span>
                  </div>
                  <span className="text-[9px] text-white/70 font-medium">Carlos</span>
                  <span className="text-[8px] text-frame-500 ml-auto">1:23</span>
                </div>
                <p className="text-[10px] text-white/80 leading-relaxed">El movimiento de cámara acá no me convence, revisemos el corte</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
