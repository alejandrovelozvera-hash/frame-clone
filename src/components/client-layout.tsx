'use client';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/toast';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
