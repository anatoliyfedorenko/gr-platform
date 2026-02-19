'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/types';
import type { User, UserRole, RolePermissions } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Mail,
  Building2,
  KeyRound,
  Ban,
  Trash2,
  Activity,
  Monitor,
  Shield,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import fallbackUsers from '@/data/users.json';

const ROLE_BADGE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'default'> = {
  gr_manager: 'blue',
  lawyer: 'purple',
  executive: 'green',
  consultant: 'orange',
  admin: 'red',
};

const PERMISSION_LABELS: Record<keyof RolePermissions, string> = {
  canCreate: 'Создание документов и инициатив',
  canEdit: 'Редактирование данных',
  canApprove: 'Утверждение документов',
  canExport: 'Экспорт данных',
  canManageStakeholders: 'Управление стейкхолдерами',
  canViewDashboard: 'Доступ к дашборду',
  canViewReports: 'Просмотр отчётов',
  canSwitchWorkspace: 'Переключение рабочих пространств',
  canEditSettings: 'Редактирование настроек',
};

const MOCK_ACTIVITIES = [
  { id: 1, text: 'Вход в систему', date: '2025-01-15T10:30:00Z' },
  { id: 2, text: 'Создан документ "Аналитическая записка по регулированию OTT"', date: '2025-01-15T11:15:00Z' },
  { id: 3, text: 'Обновлена инициатива "Закон о связи"', date: '2025-01-14T16:45:00Z' },
  { id: 4, text: 'Экспорт отчёта за декабрь', date: '2025-01-14T14:20:00Z' },
  { id: 5, text: 'Добавлен стейкхолдер Петров А.В.', date: '2025-01-13T09:30:00Z' },
  { id: 6, text: 'Вход в систему', date: '2025-01-13T09:00:00Z' },
  { id: 7, text: 'Утверждён документ "Официальное письмо в Минцифры"', date: '2025-01-12T15:10:00Z' },
  { id: 8, text: 'Просмотр дашборда рисков', date: '2025-01-12T10:00:00Z' },
];

const MOCK_SESSIONS = [
  {
    id: 1,
    ip: '192.168.1.45',
    browser: 'Chrome 120 / macOS',
    lastActivity: '2025-01-15T10:30:00Z',
    current: true,
  },
  {
    id: 2,
    ip: '10.0.0.12',
    browser: 'Safari 17 / iOS',
    lastActivity: '2025-01-14T18:45:00Z',
    current: false,
  },
  {
    id: 3,
    ip: '172.16.0.8',
    browser: 'Firefox 121 / Windows',
    lastActivity: '2025-01-10T12:00:00Z',
    current: false,
  },
];

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { companies } = useStore();
  const users: User[] = (useStore() as any).users || (fallbackUsers as User[]);

  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('activity');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const user = useMemo(
    () => users.find((u) => u.id === id),
    [users, id]
  );

  const companyName = useMemo(() => {
    if (!user?.companyId) return null;
    return companies.find((c) => c.id === user.companyId)?.name || null;
  }, [user, companies]);

  const permissions = useMemo(() => {
    if (!user) return null;
    return ROLE_PERMISSIONS[user.role];
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = () => {
    const removeUser = (useStore.getState() as any).removeUser;
    if (typeof removeUser === 'function') {
      removeUser(id);
    } else {
      const currentUsers = (useStore.getState() as any).users || (fallbackUsers as User[]);
      useStore.setState({ users: currentUsers.filter((u: User) => u.id !== id) } as any);
    }
    setShowDeleteModal(false);
    toast.success('Пользователь удалён');
    router.push('/admin/users');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Пользователь не найден</h2>
        <p className="text-gray-500 mb-6">Запрошенный профиль не существует или был удалён.</p>
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Пользователи', href: '/admin/users' },
          { label: user.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                    <Badge variant={ROLE_BADGE_VARIANT[user.role] || 'default'}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                    <Badge variant="green">Активен</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{user.email}</span>
                    </div>
                    {companyName && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <Link
                          href={`/admin/companies/${user.companyId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {companyName}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="activity">
                <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Активность</span>
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> Сессии</span>
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Права доступа</span>
              </TabsTrigger>
            </TabsList>

            {/* Activity tab */}
            <TabsContent value="activity">
              <div className="space-y-3">
                {MOCK_ACTIVITIES.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{activity.text}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(activity.date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sessions tab */}
            <TabsContent value="sessions">
              <div className="space-y-3">
                {MOCK_SESSIONS.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{session.browser}</span>
                            {session.current && (
                              <Badge variant="green" className="text-[10px]">Текущая</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>IP: {session.ip}</span>
                            <span>Последняя активность: {formatDate(session.lastActivity)}</span>
                          </div>
                        </div>
                        {!session.current && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.success('Сессия отозвана')}
                          >
                            Отозвать
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Permissions tab */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Права роли: {ROLE_LABELS[user.role] || user.role}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {permissions && (
                    <div className="space-y-3">
                      {(Object.keys(PERMISSION_LABELS) as (keyof RolePermissions)[]).map((key) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-5 h-5 rounded ${
                            permissions[key]
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {permissions[key] ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <span className={`text-sm ${
                            permissions[key] ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {PERMISSION_LABELS[key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toast.success('Ссылка для сброса пароля отправлена на ' + user.email)}
                >
                  <KeyRound className="h-4 w-4" />
                  Сбросить пароль
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                  onClick={() => toast.info('Пользователь заблокирован (демо)')}
                >
                  <Ban className="h-4 w-4" />
                  Заблокировать
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить пользователя
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono text-gray-900">{user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Роль</span>
                  <span className="text-gray-900">{ROLE_LABELS[user.role]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Компания</span>
                  <span className="text-gray-900">{companyName || '---'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Создан</span>
                  <span className="text-gray-900">10.01.2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Последний вход</span>
                  <span className="text-gray-900">15.01.2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удаление пользователя"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить пользователя <strong>{user.name}</strong>? Это действие необратимо.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
