'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Building2, Plus } from 'lucide-react';
import fallbackUsers from '@/data/users.json';

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Все отрасли' },
  { value: 'Телеком', label: 'Телеком' },
  { value: 'IT', label: 'IT' },
  { value: 'Финансы', label: 'Финансы' },
  { value: 'Энергетика', label: 'Энергетика' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'active', label: 'Активна' },
];

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { companies, initiatives } = useStore();
  const users: User[] = (useStore() as any).users || (fallbackUsers as User[]);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(companies.map((c) => c.region))).sort();
    return [
      { value: '', label: 'Все регионы' },
      ...regions.map((r) => ({ value: r, label: r })),
    ];
  }, [companies]);

  const usersCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      if (u.companyId) {
        map[u.companyId] = (map[u.companyId] || 0) + 1;
      }
    });
    return map;
  }, [users]);

  const initiativesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    initiatives.forEach((ini) => {
      (ini.companyIds || []).forEach((cId: string) => {
        map[cId] = (map[cId] || 0) + 1;
      });
    });
    return map;
  }, [initiatives]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.inn.toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = !industryFilter || c.industry.includes(industryFilter);
      const matchesRegion = !regionFilter || c.region === regionFilter;
      const matchesStatus = !statusFilter || statusFilter === 'active';
      return matchesSearch && matchesIndustry && matchesRegion && matchesStatus;
    });
  }, [companies, search, industryFilter, regionFilter, statusFilter]);

  const columns = [
    {
      key: 'name',
      title: 'Название',
      sortable: true,
      render: (val: string) => (
        <span className="font-medium text-gray-900">{val}</span>
      ),
    },
    {
      key: 'inn',
      title: 'ИНН',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm text-gray-600">{val}</span>
      ),
    },
    {
      key: 'industry',
      title: 'Отрасль',
      sortable: true,
      render: (val: string) => <Badge variant="blue">{val}</Badge>,
    },
    {
      key: 'region',
      title: 'Регион',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm text-gray-600">{val}</span>
      ),
    },
    {
      key: 'id',
      title: 'Пользователи',
      sortable: false,
      render: (_val: string, row: any) => (
        <span className="text-sm text-gray-600">{usersCountMap[row.id] || 0}</span>
      ),
    },
    {
      key: 'id',
      title: 'Инициативы',
      sortable: false,
      render: (_val: string, row: any) => (
        <span className="text-sm text-gray-600">{initiativesCountMap[row.id] || 0}</span>
      ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: false,
      render: () => <Badge variant="green">Активна</Badge>,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
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
          { label: 'Компании' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Компании</h1>
          <Badge variant="default">{companies.length}</Badge>
        </div>
        <Button onClick={() => router.push('/admin/companies/new')}>
          <Plus className="h-4 w-4" />
          Создать компанию
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по названию или ИНН..."
          className="w-64"
        />
        <Select
          options={INDUSTRY_OPTIONS}
          value={industryFilter}
          onChange={setIndustryFilter}
          className="w-48"
        />
        <Select
          options={regionOptions}
          value={regionFilter}
          onChange={setRegionFilter}
          className="w-48"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-44"
        />
      </div>

      {/* Table */}
      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Компании не найдены</h3>
          <p className="text-sm text-gray-500">
            Попробуйте изменить параметры фильтрации или создайте новую компанию.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCompanies}
          onRowClick={(row) => router.push(`/admin/companies/${row.id}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
