'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS, type User } from '@/lib/types';
import usersData from '@/data/users.json';

const users = usersData as User[];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userId = selectedUserId || (email ? users.find((u) => u.email === email)?.id : null);

    if (!userId && !email) {
      toast.error('Выберите демо-аккаунт или введите email');
      setIsLoading(false);
      return;
    }

    const finalUserId = userId || users[0].id;

    try {
      login(finalUserId);
      const user = users.find((u) => u.id === finalUserId);
      toast.success(`Добро пожаловать, ${user?.name || 'Пользователь'}!`);

      if (user?.role === 'consultant') {
        router.push('/select-workspace');
      } else {
        router.push('/app/dashboard');
      }
    } catch {
      toast.error('Ошибка при входе в систему');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GR Intelligence Platform</h1>
          <p className="mt-2 text-sm text-gray-500">
            Платформа мониторинга и анализа регуляторных инициатив
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Demo Account Selector */}
            <div>
              <label
                htmlFor="demo-account"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Демо-аккаунт
              </label>
              <div className="relative">
                <select
                  id="demo-account"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    const user = users.find((u) => u.id === e.target.value);
                    if (user) {
                      setEmail(user.email);
                    }
                  }}
                  className="flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите пользователя...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({ROLE_LABELS[user.role]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-4 flex-shrink-0 text-xs text-gray-400">или</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.ru"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Войти
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Демо-версия. Выберите аккаунт для входа.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; 2026 GR Intelligence Platform. Все права защищены.
        </p>
      </div>
    </div>
  );
}
