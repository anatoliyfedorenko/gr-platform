'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import usersData from '@/data/users.json';
import type {
  SupportTicket,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  User,
  Company,
} from '@/lib/types';

const users = usersData as User[];

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  bug_report: 'Ошибка',
  feature_request: 'Предложение',
  question: 'Вопрос',
  data_issue: 'Проблема с данными',
  other: 'Другое',
};

const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const STATUS_LABELS: Record<SupportStatus, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const PRIORITY_VARIANTS: Record<SupportPriority, 'default' | 'yellow' | 'red'> = {
  low: 'default',
  medium: 'yellow',
  high: 'red',
};

const STATUS_VARIANTS: Record<SupportStatus, 'yellow' | 'blue' | 'green' | 'default'> = {
  open: 'yellow',
  in_progress: 'blue',
  resolved: 'green',
  closed: 'default',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'Все категории' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Все приоритеты' },
  ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function getUserName(userId: string): string {
  const user = users.find((u) => u.id === userId);
  return user?.name || 'Неизвестный';
}

function getUserCompanyId(userId: string): string | null {
  const user = users.find((u) => u.id === userId);
  return user?.companyId || null;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const store = useStore() as any;
  const companies: Company[] = store.companies || [];
  const allTickets: SupportTicket[] = store.supportTickets || [];

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  function getCompanyName(companyId: string | null): string {
    if (!companyId) return '--';
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.name || companyId;
  }

  const companyOptions = useMemo(() => {
    return [
      { value: '', label: 'Все компании' },
      ...companies.map((c: Company) => ({ value: c.id, label: c.name })),
    ];
  }, [companies]);

  const filteredTickets = useMemo(() => {
    let result = allTickets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t: SupportTicket) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          getUserName(t.userId).toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter((t: SupportTicket) => t.category === filterCategory);
    }
    if (filterPriority) {
      result = result.filter((t: SupportTicket) => t.priority === filterPriority);
    }
    if (filterStatus) {
      result = result.filter((t: SupportTicket) => t.status === filterStatus);
    }
    if (filterCompany) {
      result = result.filter((t: SupportTicket) => t.companyId === filterCompany);
    }

    return result;
  }, [allTickets, search, filterCategory, filterPriority, filterStatus, filterCompany]);

  // Stats
  const openCount = allTickets.filter((t: SupportTicket) => t.status === 'open').length;
  const inProgressCount = allTickets.filter((t: SupportTicket) => t.status === 'in_progress').length;
  const resolvedCount = allTickets.filter((t: SupportTicket) => t.status === 'resolved').length;
  const unassignedCount = allTickets.filter((t: SupportTicket) => !t.assignedTo && t.status !== 'closed').length;

  function getAssignedName(assignedTo: string | null): string {
    if (!assignedTo) return '--';
    return getUserName(assignedTo);
  }

  const columns: DataTableColumn<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      title: '№ тикета',
      sortable: true,
      render: (value: string) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      key: 'subject',
      title: 'Тема',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-700 line-clamp-1">{value}</span>
      ),
    },
    {
      key: 'userId',
      title: 'Пользователь',
      render: (value: string) => {
        const companyId = getUserCompanyId(value);
        return (
          <div>
            <p className="text-sm text-gray-900">{getUserName(value)}</p>
            <p className="text-xs text-gray-500">{getCompanyName(companyId)}</p>
          </div>
        );
      },
    },
    {
      key: 'category',
      title: 'Категория',
      render: (value: SupportCategory) => (
        <Badge variant="default">{CATEGORY_LABELS[value] || value}</Badge>
      ),
    },
    {
      key: 'priority',
      title: 'Приоритет',
      sortable: true,
      render: (value: SupportPriority) => (
        <Badge variant={PRIORITY_VARIANTS[value] || 'default'}>
          {PRIORITY_LABELS[value] || value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: true,
      render: (value: SupportStatus) => (
        <Badge variant={STATUS_VARIANTS[value] || 'default'}>
          {STATUS_LABELS[value] || value}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Дата создания',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      ),
    },
    {
      key: 'assignedTo',
      title: 'Назначен',
      render: (value: string | null) => (
        <span className="text-sm text-gray-500">{getAssignedName(value)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Тикеты поддержки</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Открытые</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">В работе</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Решённые</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{resolvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Среднее время ответа</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">4.2 ч</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500">Не назначены</p>
            <p className={`mt-1 text-2xl font-bold ${unassignedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {unassignedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по номеру, теме, пользователю..."
          className="w-72"
        />
        <Select
          options={CATEGORY_OPTIONS}
          value={filterCategory}
          onChange={setFilterCategory}
          className="w-44"
        />
        <Select
          options={PRIORITY_OPTIONS}
          value={filterPriority}
          onChange={setFilterPriority}
          className="w-40"
        />
        <Select
          options={STATUS_OPTIONS}
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-36"
        />
        <Select
          options={companyOptions}
          value={filterCompany}
          onChange={setFilterCompany}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTickets}
        onRowClick={(row) => router.push(`/admin/support/${row.id}`)}
        emptyMessage="Тикетов не найдено"
      />
    </div>
  );
}
