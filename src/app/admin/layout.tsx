'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, currentRole } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand hydration (persisted store) before checking auth
  useEffect(() => {
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Перенаправление...</p>
        </div>
      </div>
    );
  }

  // If logged in but not admin, show 403
  if (currentRole !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">403 — Доступ запрещён</h1>
            <p className="mt-2 text-sm text-gray-500">
              У вас нет прав для доступа к панели администратора.
            </p>
          </div>
          <button
            onClick={() => router.push('/app/dashboard')}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Вернуться в GR Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-64 pt-4 transition-all">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
