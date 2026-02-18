'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand hydration (persisted store) before checking auth
  useEffect(() => {
    // Zustand persist rehydrates synchronously on first render,
    // but we still need a tick to read the hydrated state.
    const unsubFinishHydration = useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If hydration already happened before this effect runs
    if (useStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  // Once hydrated, check if user is logged in
  useEffect(() => {
    if (isHydrated && !currentUser) {
      router.push('/login');
    }
  }, [isHydrated, currentUser, router]);

  // Show loading while waiting for hydration
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show nothing (redirect will happen)
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      <main className="ml-64 pt-16 transition-all">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
