'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import api from '@/lib/api';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('swm_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        transition: 'margin-left var(--transition-base)',
      }}>
        {children}
      </main>
    </div>
  );
}
