'use client';
import { useEffect, useRef, useState } from 'react';

const steps = [
  { id: 'upload', label: 'Sube tu video', desc: 'Arrastra y suelta cualquier formato. Se optimiza para streaming rápido.' },
  { id: 'comment', label: 'Comenta en cualquier frame', desc: 'Pausa el video, señala con el mouse o el dedo, y deja un comentario con timestamp exacto.' },
  { id: 'annotate', label: 'Dibuja anotaciones', desc: 'Flechas, rectángulos o dibujo libre. Tus marcas quedan sincronizadas con el frame.' },
  { id: 'approve', label: 'Aprueba y comparte', desc: 'Resuelve comentarios, comparte un link público y cierra la revisión.' },
];

const ANIMATION_DELAY = 4500;

export default function ProductDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
      setProgress(0);
    }, ANIMATION_DELAY);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + 100 / (ANIMATION_DELAY / 50), 100));
    }, 50);
    return () => clearInterval(progressTimer);
  }, [visible, currentStep]);

  useEffect(() => {
    setProgress(0);
  }, [currentStep]);

  const step = steps[currentStep];
  const is = (id: string) => step.id === id;
  const stepIndex = steps.findIndex(s => s.id === step.id);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
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
          {/* Left: Steps */}
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-500 cursor-pointer ${
                  i === currentStep
                    ? 'bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                    : 'opacity-40 hover:opacity-70 border border-transparent'
                }`}
                onClick={() => { setCurrentStep(i); setProgress(0); }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all ${
                  i === currentStep
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-frame-800 text-frame-500'
                }`}>
                  {i + 1}
                </div>
                <div className="pt-0.5 flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold mb-1 transition-colors ${
                    i === currentStep ? 'text-white' : 'text-frame-400'
                  }`}>{s.label}</h3>
                  <p className="text-xs text-frame-500 leading-relaxed">{s.desc}</p>
                  {i === currentStep && (
                    <div className="mt-2 h-1 bg-frame-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-150 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Demo player */}
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

            {/* Video player area */}
            <div className="relative bg-black h-[calc(100%-36px)] flex items-center justify-center overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-frame-950 to-purple-900/20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06),transparent_70%)]" />
              </div>

              {/* === STEP 1: Upload === */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ${
                is('upload') ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-blue-400/50 flex items-center justify-center mb-4 bg-blue-500/5">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm font-medium mb-3">Arrastrá tu video acá</p>
                <div className="w-48 h-2 bg-frame-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-[3000ms] ease-out"
                    style={{ width: visible ? '100%' : '0%' }} />
                </div>
                <p className="text-[10px] text-frame-500 mt-2">Optimizando para streaming...</p>
              </div>

              {/* === STEP 2: Comment === */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                is('comment') ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                {/* Video playing indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                    <span className="w-1 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                    <span className="w-1 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                  </div>
                  <span className="text-[9px] text-green-400/80 font-medium">Reproduciendo</span>
                </div>

                {/* Timeline progress */}
                <div className="absolute bottom-16 left-4 right-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${progress * 0.6}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/40 font-mono">{Math.floor(progress * 0.06)}:23</span>
                    <span className="text-[10px] text-white/40 font-mono">3:45</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 16.5l3-3m0 0l3-3m-3 3H21M3 12V3m0 0h9m-9 0v9" /></svg>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>

                {/* Comment bubble (appears midway) */}
                <div className="absolute top-8 right-4 max-w-[180px] bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-frame-700/50 shadow-xl transition-all duration-500"
                  style={{ opacity: progress > 40 ? 1 : 0, transform: progress > 40 ? 'translateY(0)' : 'translateY(10px)' }}>
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

              {/* === STEP 3: Annotate === */}
              <div className={`absolute inset-0 transition-all duration-700 ${
                is('annotate') ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                {/* Paused icon */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                  </div>
                  <span className="text-[9px] text-yellow-400/80 font-medium">Pausado</span>
                </div>

                {/* Drawing toolbar */}
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-frame-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-frame-700/50">
                  {['freehand', 'arrow', 'rectangle'].map((tool, i) => (
                    <div key={tool} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 ${
                      i === 1 ? 'bg-blue-600 text-white' : 'bg-frame-800 text-frame-500'
                    }`} style={{ opacity: progress > 20 + i * 15 ? 1 : 0.3 }}>
                      {tool === 'freehand' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      ) : tool === 'arrow' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pause overlay icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>

                {/* Annotation arrow appearing */}
                <svg className="absolute top-1/3 left-[30%] transition-all duration-700" style={{
                  opacity: progress > 30 ? 1 : 0,
                  transform: progress > 30 ? 'translateX(0)' : 'translateX(-20px)',
                }} width="100" height="60" viewBox="0 0 100 60" fill="none">
                  <path d="M10 50 Q 40 10 80 15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M80 15 L 90 12 L 85 22 Z" fill="#ef4444" />
                </svg>

                {/* Annotation rectangle */}
                <div className="absolute top-[55%] left-[55%] w-16 h-10 border-2 border-blue-400 rounded transition-all duration-700" style={{
                  opacity: progress > 50 ? 1 : 0,
                  transform: progress > 50 ? 'scale(1)' : 'scale(0.8)',
                }} />

                {/* Timestamp display */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="text-[10px] text-white/40 font-mono">1:23.45</span>
                  <span className="text-blue-400 text-[9px] font-medium px-2 py-0.5 rounded bg-blue-500/10">Anotando</span>
                </div>
              </div>

              {/* === STEP 4: Approve & Share === */}
              <div className={`absolute inset-0 flex flex-col transition-all duration-700 ${
                is('approve') ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-frame-900/80 backdrop-blur-sm border-b border-frame-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80 text-xs font-medium">3 comentarios resueltos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 text-[9px] font-medium">Listo para compartir</span>
                  </div>
                </div>

                {/* Share panel */}
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="w-full max-w-xs bg-frame-800/60 backdrop-blur-sm rounded-2xl p-5 border border-frame-700/40 transition-all duration-700"
                    style={{ opacity: progress > 20 ? 1 : 0, transform: progress > 20 ? 'translateY(0)' : 'translateY(15px)' }}>
                    {/* Checkmark */}
                    <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <h4 className="text-white text-sm font-semibold text-center mb-1">Revisión completa</h4>
                    <p className="text-frame-400 text-[10px] text-center mb-4">Todos los comentarios fueron resueltos</p>

                    {/* Share link */}
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 bg-frame-900 rounded-lg border border-frame-700/50 flex items-center px-3">
                        <span className="text-[9px] text-frame-500 truncate">videoauditor.app/s/abc123</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-[9px] text-frame-600 text-center mt-2">Compartí el link con revisores externos</p>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-frame-900/60 border-t border-frame-800/40">
                  <span className="text-[9px] text-frame-500">4 comentarios · 3 resueltos · 1 pendiente</span>
                  <span className="text-[9px] text-green-400/70">Aprobado</span>
                </div>
              </div>

              {/* Step indicator overlay */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      i === currentStep
                        ? 'bg-blue-600 text-white scale-110'
                        : i < currentStep
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-frame-800/60 text-frame-500'
                    }`}>
                      <span className="text-[8px] font-bold">{i < currentStep ? '✓' : i + 1}</span>
                    </div>
                    <span className={`text-[8px] hidden sm:block transition-colors ${
                      i === currentStep ? 'text-white/80' : 'text-frame-600'
                    }`}>{s.label}</span>
                    {i < steps.length - 1 && (
                      <div className={`w-4 h-px transition-colors ${i < currentStep ? 'bg-green-500/40' : 'bg-frame-700/50'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
