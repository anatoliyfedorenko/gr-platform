'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import type { Stakeholder } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  government: 'Государственный орган',
  regulator: 'Регулятор',
  industry: 'Отраслевой эксперт',
};

const TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'orange' | 'default'> = {
  government: 'blue',
  regulator: 'purple',
  industry: 'orange',
};

const POSITION_LABELS: Record<string, string> = {
  supportive: 'Поддержка',
  neutral: 'Нейтральная',
  opposed: 'Оппозиция',
  unknown: 'Неизвестно',
};

const POSITION_VARIANT: Record<string, 'green' | 'default' | 'red' | 'blue'> = {
  supportive: 'green',
  neutral: 'default',
  opposed: 'red',
  unknown: 'blue',
};

const INFLUENCE_NUM: Record<string, number> = {
  high: 5,
  medium: 3,
  low: 1,
};

const typeOptions = [
  { value: '', label: 'Все типы' },
  { value: 'government', label: 'Государственный орган' },
  { value: 'regulator', label: 'Регулятор' },
  { value: 'industry', label: 'Отраслевой эксперт' },
];

const positionOptions = [
  { value: '', label: 'Все позиции' },
  { value: 'supportive', label: 'Поддержка' },
  { value: 'neutral', label: 'Нейтральная' },
  { value: 'opposed', label: 'Оппозиция' },
  { value: 'unknown', label: 'Неизвестно' },
];

const influenceOptions = [
  { value: '', label: 'Все уровни влияния' },
  { value: 'high', label: 'Высокое (4-5)' },
  { value: 'medium', label: 'Среднее (3)' },
  { value: 'low', label: 'Низкое (1-2)' },
];

function InfluenceDots({ level }: { level: string }) {
  const count = INFLUENCE_NUM[level] || 1;
  return (
    <span className="inline-flex items-center gap-0.5" title={`Влияние: ${count}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full ${
            i < count ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </span>
  );
}

export default function StakeholdersPage() {
  const router = useRouter();
  const { stakeholders } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [influenceFilter, setInfluenceFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.organization.toLowerCase().includes(search.toLowerCase()) ||
        s.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = !typeFilter || s.type === typeFilter;
      const matchesPosition = !positionFilter || s.position === positionFilter;
      const matchesInfluence = !influenceFilter || s.influence === influenceFilter;
      return matchesSearch && matchesType && matchesPosition && matchesInfluence;
    });
  }, [stakeholders, search, typeFilter, positionFilter, influenceFilter]);

  const columns = [
    {
      key: 'name',
      title: 'Имя',
      sortable: true,
      render: (val: string, row: Stakeholder) => (
        <div>
          <span className="font-medium text-gray-900">{val}</span>
        </div>
      ),
    },
    {
      key: 'organization',
      title: 'Организация',
      sortable: true,
      render: (val: string) => <span className="text-sm text-gray-700">{val}</span>,
    },
    {
      key: 'type',
      title: 'Тип',
      sortable: true,
      render: (val: string) => (
        <Badge variant={TYPE_VARIANT[val] || 'default'}>
          {TYPE_LABELS[val] || val}
        </Badge>
      ),
    },
    {
      key: 'influence',
      title: 'Влияние',
      sortable: true,
      render: (val: string) => <InfluenceDots level={val} />,
    },
    {
      key: 'position',
      title: 'Позиция',
      sortable: true,
      render: (val: string) => (
        <Badge variant={POSITION_VARIANT[val] || 'default'}>
          {POSITION_LABELS[val] || val}
        </Badge>
      ),
    },
    {
      key: 'lastInteraction',
      title: 'Последнее взаимодействие',
      sortable: true,
      render: (val: string | null) =>
        val ? (
          <span className="text-sm text-gray-500">{formatDate(val)}</span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'topics',
      title: 'Темы',
      sortable: false,
      render: (val: string[]) => {
        if (!val || val.length === 0) return <span className="text-gray-400">--</span>;
        const display = val.slice(0, 2);
        const remaining = val.length - 2;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {display.map((topic) => (
              <Badge key={topic} variant="default" className="text-[10px] px-1.5 py-0">
                {topic}
              </Badge>
            ))}
            {remaining > 0 && (
              <span className="text-xs text-gray-500 font-medium">+{remaining}</span>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Стейкхолдеры</h1>
        <Badge variant="default">{stakeholders.length}</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени, организации, теме..."
          className="w-72"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={setTypeFilter}
          className="w-52"
        />
        <Select
          options={influenceOptions}
          value={influenceFilter}
          onChange={setInfluenceFilter}
          className="w-48"
        />
        <Select
          options={positionOptions}
          value={positionFilter}
          onChange={setPositionFilter}
          className="w-44"
        />
      </div>

      {/* Table */}
      {filteredStakeholders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Стейкхолдеры не найдены</h3>
          <p className="text-sm text-gray-500">
            Попробуйте изменить параметры фильтрации.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStakeholders}
          onRowClick={(row) => router.push(`/app/stakeholders/${row.id}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
