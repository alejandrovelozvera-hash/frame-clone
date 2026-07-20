'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

const tabs = [
  {
    id: 'dashboard',
    label: 'Proyectos',
    href: '/dashboard',
    icon: (active: boolean) => (
      <svg className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Subir',
    href: '',
    icon: () => (
      <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Perfil',
    href: '',
    icon: (active: boolean) => (
      <svg className="w-[26px] h-[26px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [pressedId, setPressedId] = useState<string | null>(null);

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.id === 'dashboard') return pathname === '/dashboard' || pathname.startsWith('/project/');
    return false;
  };

  const handlePress = (tab: typeof tabs[0]) => {
    if (tab.id === 'profile') {
      logout();
      router.push('/');
    } else if (tab.id === 'upload') {
      const back = pathname.startsWith('/project/') ? pathname : '/dashboard';
      const token = localStorage.getItem('token');
      const projectId = back === '/dashboard'
        ? null
        : pathname.split('/project/')[1]?.split('/')[0];
      if (projectId) {
        router.push(back);
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('open-upload', { detail: { projectId } }));
        }, 100);
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push(tab.href);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="relative liquid-glass flex items-start justify-around pt-1 pb-1.5">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handlePress(tab)}
              onPointerDown={() => setPressedId(tab.id)}
              onPointerUp={() => setPressedId(null)}
              onPointerLeave={() => setPressedId(null)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 w-[72px] transition-all duration-150 select-none"
            >
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-white'
                  : pressedId === tab.id
                    ? 'text-white/80 scale-90'
                    : 'text-white/40 hover:text-white/60'
              }`}>
                {tab.icon(active)}
              </div>
              <span className={`text-[11px] font-semibold tracking-[-0.01em] transition-all duration-200 ${
                active ? 'text-white/90' : 'text-white/30'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
