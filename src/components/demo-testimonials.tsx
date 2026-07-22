'use client';
import { useEffect, useRef, useState } from 'react';

const testimonials = [
  {
    name: 'Sofía Martínez',
    role: 'Directora de producción · Estudio CineSur',
    avatar: 'S',
    color: '#3b82f6',
    text: 'Dejamos de usar Frame.io. Video Auditor nos da todo lo que necesitamos sin límites de proyectos ni costos ocultos.',
  },
  {
    name: 'Lucas Gómez',
    role: 'Editor de video · Freelance',
    avatar: 'L',
    color: '#a855f7',
    text: 'Las anotaciones frame-accurate y los cursores en vivo cambiaron la forma en que revisamos con los directores.',
  },
  {
    name: 'Carolina Ruiz',
    role: 'CMO · Agencia Pulso',
    avatar: 'C',
    color: '#06b6d4',
    text: 'Compartir links públicos con clientes es increíble. Ya no hacemos screenshots ni emails interminables.',
  },
];

export default function Demotestimonials() {
  const [active, setActive] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setHighlighted(p => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(t);
  }, [active]);

  return (
    <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">Lo que dicen los equipos</h2>
          <p className="text-frame-400 text-sm sm:text-base max-w-xl mx-auto">De estudios de producción a freelancers, Video Auditor simplifica la revisión de video.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-5 sm:p-6 border transition-all duration-700 cursor-pointer ${
                i === highlighted
                  ? 'bg-frame-800/80 border-blue-500/30 shadow-xl shadow-blue-500/5 scale-[1.02]'
                  : 'bg-frame-900/50 border-frame-800/50 opacity-60 hover:opacity-90'
              }`}
              onClick={() => setHighlighted(i)}
            >
              {/* Quote mark */}
              <svg className={`w-6 h-6 mb-3 transition-colors ${i === highlighted ? 'text-blue-400' : 'text-frame-600'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.656-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.656-2.917-1.179z" />
              </svg>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">{t.text}</p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
                  style={{ backgroundColor: `${t.color}20` }}>
                  <span className="text-xs font-medium" style={{ color: t.color }}>{t.avatar}</span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{t.name}</p>
                  <p className="text-frame-500 text-[10px] mt-0.5">{t.role}</p>
                </div>
              </div>

              {/* Active indicator */}
              {i === highlighted && (
                <div className="absolute -top-px left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setHighlighted(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === highlighted ? 'bg-blue-400 w-6' : 'bg-frame-700 hover:bg-frame-600'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
