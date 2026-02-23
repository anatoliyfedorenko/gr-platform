'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: '', label: 'Выберите роль' },
  { value: 'gr_manager', label: 'GR Менеджер' },
  { value: 'lawyer', label: 'Юрист/Комплаенс' },
  { value: 'executive', label: 'Руководитель' },
  { value: 'consultant', label: 'Консультант' },
  { value: 'admin', label: 'Администратор' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Активен' },
  { value: 'suspended', label: 'Заблокирован' },
];

export default function AdminCreateUserPage() {
  const router = useRouter();
  const { companies } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [sendInvite, setSendInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyOptions = useMemo(() => {
    return [
      { value: '', label: 'Без компании' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [companies]);

  const isValid = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && role.length > 0;
  }, [name, email, role]);

  const handleCreate = () => {
    if (!isValid) return;
    setIsSubmitting(true);

    const newUser: User = {
      id: `u${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: role as UserRole,
      companyId: role === 'admin' ? null : (companyId || null),
      avatar: null,
    };

    // Try store action first, fallback to direct state update
    const addUser = (useStore.getState() as any).addUser;
    if (typeof addUser === 'function') {
      addUser(newUser);
    } else {
      // Update users array if it exists in state, otherwise set it
      const currentUsers = (useStore.getState() as any).users || [];
      useStore.setState({ users: [...currentUsers, newUser] } as any);
    }

    if (sendInvite) {
      toast.success('Пользователь создан. Приглашение отправлено на ' + email.trim());
    } else {
      toast.success('Пользователь успешно создан');
    }
    router.push('/admin/users');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Пользователи', href: '/admin/users' },
          { label: 'Создание' },
        ]}
      />

      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Создание пользователя</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Данные пользователя</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ФИО <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.ru"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль <span className="text-red-500">*</span>
                </label>
                <Select
                  options={ROLE_OPTIONS}
                  value={role}
                  onChange={setRole}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Компания
                </label>
                <Select
                  options={companyOptions}
                  value={companyId}
                  onChange={setCompanyId}
                  disabled={role === 'admin'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+996 (555) 123-456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <Select
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                />
              </div>
            </div>

            {/* Send invite toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                role="switch"
                aria-checked={sendInvite}
                onClick={() => setSendInvite(!sendInvite)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  sendInvite ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sendInvite ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <label className="text-sm text-gray-700">
                Отправить приглашение по email
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button onClick={handleCreate} disabled={!isValid || isSubmitting}>
                Создать пользователя
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/users')}
              >
                Отмена
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
