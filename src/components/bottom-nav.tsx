'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const tabs = [
  {
    id: 'dashboard',
    label: 'Proyectos',
    href: '/dashboard',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Perfil',
    href: '',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.id === 'dashboard') return pathname === '/dashboard' || pathname.startsWith('/project/');
    return false;
  };

  const handlePress = (tab: typeof tabs[0]) => {
    if (tab.id === 'profile') {
      logout();
      router.push('/');
    } else {
      router.push(tab.href);
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="bg-frame-900/90 backdrop-blur-2xl border-t border-frame-700/40 flex items-center justify-around py-1">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handlePress(tab)}
              className={`flex flex-col items-center gap-0.5 py-1 px-6 rounded-xl transition-all active:scale-90 ${
                active ? 'text-blue-400' : 'text-frame-500 hover:text-frame-300'
              }`}
            >
              {tab.icon(active)}
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
