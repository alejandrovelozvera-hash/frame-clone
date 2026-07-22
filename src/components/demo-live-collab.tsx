'use client';
import { useEffect, useRef, useState } from 'react';

const users = [
  { id: 'maria', name: 'María', color: '#f59e0b', avatar: 'M' },
  { id: 'carlos', name: 'Carlos', color: '#a855f7', avatar: 'C' },
  { id: 'ana', name: 'Ana', color: '#06b6d4', avatar: 'A' },
];

export default function DemoLiveCollab() {
  const [active, setActive] = useState(false);
  const [commentPhase, setCommentPhase] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setCommentPhase(p => (p + 1) % 4), 3500);
    return () => clearInterval(t);
  }, [active]);

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-frame-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Colaboración en vivo</h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">Varios revisores al mismo tiempo. Cursores, comentarios y anotaciones en tiempo real.</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto aspect-[16/9] bg-frame-950 rounded-2xl border border-frame-800/60 overflow-hidden shadow-2xl shadow-black/30">
          {/* Browser chrome with online users */}
          <div className="flex items-center gap-1.5 px-4 h-9 bg-frame-900 border-b border-frame-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <div className="flex items-center gap-1 ml-4">
              {users.map(u => (
                <div key={u.id} className="w-5 h-5 rounded-full flex items-center justify-center -ml-1 first:ml-0 border border-frame-900"
                  style={{ backgroundColor: `${u.color}30` }}>
                  <span className="text-[7px] font-medium" style={{ color: u.color }}>{u.avatar}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[9px] text-green-400/70 font-medium">3 online</span>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-blue-900/10 via-frame-950 to-purple-900/10 h-[calc(100%-36px)]">
            {/* Video content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-frame-900/80 border border-frame-800/50 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-frame-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-frame-500 text-[10px]">Reproduciendo — 1:23 / 3:45</p>
              </div>
            </div>

            {/* User cursors */}
            <div className={`absolute inset-0 transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
              {users.map((u, i) => (
                <div key={u.id}
                  className={`absolute transition-all duration-[3000ms] ease-in-out animate-cursorFloat${i}`}
                  style={{
                    left: active ? `${8 + i * 28}%` : '0%',
                    top: active ? `${30 + i * 14}%` : '50%',
                  }}>
                  <div className="relative w-3 h-3 rounded-full" style={{ backgroundColor: u.color }}>
                    <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[8px] font-medium whitespace-nowrap px-1 py-0.5 rounded bg-frame-950/80" style={{ color: u.color }}>{u.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment popups */}
            {commentPhase === 1 && (
              <div className="absolute top-12 right-6 max-w-[180px] transition-all duration-500"
                style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/50 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f59e0b30' }}>
                      <span className="text-[6px] text-[#f59e0b] font-medium">M</span>
                    </div>
                    <span className="text-[9px] text-white/70 font-medium">María</span>
                    <span className="text-[8px] text-frame-500 ml-auto">1:05</span>
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed">La transición de acá está muy lenta, habría que acortarla</p>
                </div>
              </div>
            )}

            {commentPhase === 2 && (
              <div className="absolute top-1/3 left-8 max-w-[180px] transition-all duration-500"
                style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/50 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#a855f730' }}>
                      <span className="text-[6px] text-[#a855f7] font-medium">C</span>
                    </div>
                    <span className="text-[9px] text-white/70 font-medium">Carlos</span>
                    <span className="text-[8px] text-frame-500 ml-auto">1:23</span>
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed">Coincido, y el audio está desync en esa parte</p>
                </div>
              </div>
            )}

            {commentPhase === 3 && (
              <div className="absolute bottom-20 right-8 max-w-[180px] transition-all duration-500"
                style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="bg-frame-800/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-frame-700/50 shadow-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#06b6d430' }}>
                      <span className="text-[6px] text-[#06b6d4] font-medium">A</span>
                    </div>
                    <span className="text-[9px] text-white/70 font-medium">Ana</span>
                    <span className="text-[8px] text-frame-500 ml-auto">1:30</span>
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed">Ya lo arreglo y subo nueva versión 👍</p>
                </div>
              </div>
            )}

            {/* Typing indicator at bottom */}
            <div className={`absolute bottom-16 left-8 flex items-center gap-1.5 transition-all duration-500 ${commentPhase === 2 ? 'opacity-100' : 'opacity-0'}`}
              style={{ animation: commentPhase === 2 ? 'fadeInUp 0.4s ease-out' : 'none' }}>
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-frame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[9px] text-frame-400">Ana está escribiendo...</span>
            </div>

            {/* Bottom timeline */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[9px] text-white/40 font-mono">1:23</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-2/5 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <span className="text-[9px] text-white/40 font-mono">3:45</span>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <span className="text-[8px] text-frame-500">Comentarios: 12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-10">
          {[
            { title: 'Cursores en vivo', desc: 'Vé exactamente dónde está mirando cada revisor en el timeline.' },
            { title: 'Comentarios en vivo', desc: 'Los comentarios aparecen instantáneamente para todos los conectados.' },
            { title: 'Presencia en sala', desc: 'Sabé quién está viendo el mismo video en tiempo real.' },
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
