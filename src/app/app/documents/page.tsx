'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_PERMISSIONS } from '@/lib/types';
import type { Document } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  position_paper: 'Служебная записка',
  legal_opinion: 'Юридическое заключение',
  letter: 'Официальное письмо',
  proposal: 'Предложение поправок',
  briefing: 'Справка',
  analysis: 'Аналитическая записка',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  approved: 'Утверждён',
  sent: 'Отправлен',
  in_review: 'На рассмотрении',
};

const STATUS_VARIANT: Record<string, 'default' | 'green' | 'blue' | 'yellow'> = {
  draft: 'default',
  approved: 'green',
  sent: 'blue',
  in_review: 'yellow',
};

const TYPE_VARIANT: Record<string, 'purple' | 'blue' | 'orange' | 'green' | 'default'> = {
  position_paper: 'purple',
  legal_opinion: 'blue',
  letter: 'orange',
  proposal: 'green',
  briefing: 'default',
  analysis: 'blue',
};

const typeOptions = [
  { value: '', label: 'Все типы' },
  { value: 'position_paper', label: 'Служебная записка' },
  { value: 'letter', label: 'Официальное письмо' },
  { value: 'proposal', label: 'Предложение поправок' },
  { value: 'legal_opinion', label: 'Юридическое заключение' },
  { value: 'briefing', label: 'Справка' },
  { value: 'analysis', label: 'Аналитическая записка' },
];

const statusOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'draft', label: 'Черновик' },
  { value: 'approved', label: 'Утверждён' },
  { value: 'sent', label: 'Отправлен' },
  { value: 'in_review', label: 'На рассмотрении' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { documents, initiatives, currentRole } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const permissions = ROLE_PERMISSIONS[currentRole];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Build lookup for users
  const usersMap = useMemo(() => {
    const map: Record<string, string> = {
      u1: 'Иванов А.П.',
      u2: 'Петрова М.С.',
      u3: 'Сидоров Д.В.',
      u4: 'Козлова А.И.',
      u5: 'Морозов С.А.',
      u6: 'Волкова Е.Н.',
      u7: 'Новиков А.В.',
      u8: 'Федорова О.Д.',
    };
    return map;
  }, []);

  const initiativesMap = useMemo(() => {
    const map: Record<string, string> = {};
    initiatives.forEach((ini) => {
      map[ini.id] = ini.title;
    });
    return map;
  }, [initiatives]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        (doc.initiativeId && initiativesMap[doc.initiativeId]?.toLowerCase().includes(search.toLowerCase()));
      const matchesType = !typeFilter || doc.type === typeFilter;
      const matchesStatus = !statusFilter || doc.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, search, typeFilter, statusFilter, initiativesMap]);

  const columns = [
    {
      key: 'title',
      title: 'Название',
      sortable: true,
      render: (val: string) => (
        <span className="font-medium text-gray-900">{val}</span>
      ),
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
      key: 'initiativeId',
      title: 'Связанная инициатива',
      sortable: false,
      render: (val: string | null) =>
        val && initiativesMap[val] ? (
          <span className="text-sm text-gray-600 max-w-[200px] truncate block">
            {initiativesMap[val]}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: true,
      render: (val: string) => (
        <Badge variant={STATUS_VARIANT[val] || 'default'}>
          {STATUS_LABELS[val] || val}
        </Badge>
      ),
    },
    {
      key: 'owner',
      title: 'Автор',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm">{usersMap[val] || val}</span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Обновлено',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm text-gray-500">{formatDate(val)}</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
          <Badge variant="default">{documents.length}</Badge>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => {
            const newDoc: Document = {
              id: `doc-${Date.now()}`,
              title: 'Новый документ',
              type: 'position_paper',
              initiativeId: null,
              status: 'draft',
              owner: 'u1',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
              content: {
                sections: [
                  { title: 'Раздел 1', text: '' },
                ],
              },
              relatedStakeholderIds: [],
              companyId: 'c1',
            };
            useStore.getState().addDocument(newDoc);
            router.push(`/app/documents/${newDoc.id}`);
          }}>
            <Plus className="h-4 w-4" />
            Создать документ
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск документов..."
          className="w-64"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Тип документа"
          className="w-52"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Статус"
          className="w-44"
        />
      </div>

      {/* Table */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Документы не найдены</h3>
          <p className="text-sm text-gray-500">
            Попробуйте изменить параметры фильтрации или создайте новый документ.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDocuments}
          onRowClick={(row) => router.push(`/app/documents/${row.id}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
