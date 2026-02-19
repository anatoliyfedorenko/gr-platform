'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS } from '@/lib/types';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Users as UsersIcon, Plus } from 'lucide-react';
import fallbackUsers from '@/data/users.json';

const ROLE_BADGE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'default'> = {
  gr_manager: 'blue',
  lawyer: 'purple',
  executive: 'green',
  consultant: 'orange',
  admin: 'red',
};

const ROLE_OPTIONS = [
  { value: '', label: 'Все роли' },
  { value: 'gr_manager', label: 'GR Менеджер' },
  { value: 'lawyer', label: 'Юрист/Комплаенс' },
  { value: 'executive', label: 'Руководитель' },
  { value: 'consultant', label: 'Консультант' },
  { value: 'admin', label: 'Администратор' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'active', label: 'Активен' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { companies } = useStore();
  const users: User[] = (useStore() as any).users || (fallbackUsers as User[]);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const companiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [companies]);

  const companyOptions = useMemo(() => {
    return [
      { value: '', label: 'Все компании' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [companies]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesCompany = !companyFilter || u.companyId === companyFilter;
      const matchesStatus = !statusFilter || statusFilter === 'active';
      return matchesSearch && matchesRole && matchesCompany && matchesStatus;
    });
  }, [users, search, roleFilter, companyFilter, statusFilter]);

  const columns = [
    {
      key: 'name',
      title: 'Имя',
      sortable: true,
      render: (val: string) => (
        <span className="font-medium text-gray-900">{val}</span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm text-gray-600">{val}</span>
      ),
    },
    {
      key: 'role',
      title: 'Роль',
      sortable: true,
      render: (val: UserRole) => (
        <Badge variant={ROLE_BADGE_VARIANT[val] || 'default'}>
          {ROLE_LABELS[val] || val}
        </Badge>
      ),
    },
    {
      key: 'companyId',
      title: 'Компания',
      sortable: false,
      render: (val: string | null) => (
        <span className="text-sm text-gray-600">
          {val ? companiesMap[val] || 'Неизвестная' : '---'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: false,
      render: () => <Badge variant="green">Активен</Badge>,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Пользователи' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <Badge variant="default">{users.length}</Badge>
        </div>
        <Button onClick={() => router.push('/admin/users/new')}>
          <Plus className="h-4 w-4" />
          Создать пользователя
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени или email..."
          className="w-64"
        />
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
          className="w-48"
        />
        <Select
          options={companyOptions}
          value={companyFilter}
          onChange={setCompanyFilter}
          className="w-52"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-44"
        />
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersIcon className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Пользователи не найдены</h3>
          <p className="text-sm text-gray-500">
            Попробуйте изменить параметры фильтрации или создайте нового пользователя.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
