'use client';

import { useState, useMemo } from 'react';
import { ScrollText, Download } from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_TYPE_LABELS: Record<string, string> = {
  user_created: 'Создание пользователя',
  company_created: 'Создание компании',
  settings_changed: 'Изменение настроек',
  parser_added: 'Добавление парсера',
  parser_stopped: 'Остановка парсера',
  llm_config_changed: 'Изменение LLM',
  ticket_replied: 'Ответ на тикет',
  ticket_resolved: 'Решение тикета',
  user_deleted: 'Удаление пользователя',
  role_changed: 'Изменение роли',
  document_deleted: 'Удаление документа',
  company_updated: 'Обновление компании',
};

const ACTION_BADGE_VARIANT: Record<string, 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'default'> = {
  user_created: 'blue',
  company_created: 'green',
  settings_changed: 'yellow',
  parser_added: 'purple',
  parser_stopped: 'red',
  llm_config_changed: 'orange',
  ticket_replied: 'blue',
  ticket_resolved: 'green',
  user_deleted: 'red',
  role_changed: 'yellow',
  document_deleted: 'red',
  company_updated: 'blue',
};

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Последние 7 дней' },
  { value: '30', label: 'Последние 30 дней' },
  { value: 'all', label: 'Все' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const store = useStore();
  const auditLog: any[] = (store as any).auditLog || [];

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Build action type options for filter
  const actionTypeOptions = useMemo(() => {
    const uniqueTypes = new Set(auditLog.map((entry: any) => entry.actionType));
    const opts = [{ value: 'all', label: 'Все действия' }];
    for (const type of uniqueTypes) {
      opts.push({
        value: type,
        label: ACTION_TYPE_LABELS[type] || type,
      });
    }
    // Add all known types that might not be in auditLog yet
    for (const [key, label] of Object.entries(ACTION_TYPE_LABELS)) {
      if (!uniqueTypes.has(key)) {
        opts.push({ value: key, label });
      }
    }
    return opts;
  }, [auditLog]);

  // Filtered data
  const filteredData = useMemo(() => {
    let data = [...auditLog];

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      data = data.filter((entry: any) => new Date(entry.timestamp) >= cutoff);
    }

    // Filter by action type
    if (actionFilter !== 'all') {
      data = data.filter((entry: any) => entry.actionType === actionFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (entry: any) =>
          (entry.admin || '').toLowerCase().includes(q) ||
          (entry.target || '').toLowerCase().includes(q) ||
          (entry.details || '').toLowerCase().includes(q) ||
          (ACTION_TYPE_LABELS[entry.actionType] || entry.actionType || '')
            .toLowerCase()
            .includes(q)
      );
    }

    // Sort by timestamp descending
    data.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return data;
  }, [auditLog, search, actionFilter, dateRange]);

  // Table columns
  const columns: DataTableColumn[] = [
    {
      key: 'timestamp',
      title: 'Дата и время',
      sortable: true,
      render: (value: string) => {
        if (!value) return '\u2014';
        const d = new Date(value);
        return d.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      key: 'admin',
      title: 'Администратор',
      sortable: true,
    },
    {
      key: 'actionType',
      title: 'Тип действия',
      sortable: true,
      render: (value: string) => {
        const variant = ACTION_BADGE_VARIANT[value] || 'default';
        const label = ACTION_TYPE_LABELS[value] || value || '\u2014';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'target',
      title: 'Объект',
      sortable: true,
    },
    {
      key: 'details',
      title: 'Детали',
      sortable: false,
      render: (value: string) => (
        <span className="max-w-xs truncate text-gray-500" title={value}>
          {value || '\u2014'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      title: 'IP адрес',
      sortable: false,
    },
  ];

  const handleExportCSV = () => {
    toast.success('CSV файл журнала аудита экспортирован');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <ScrollText className="h-7 w-7 text-amber-600" />
          Журнал аудита
        </h1>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Поиск по журналу..."
              className="flex-1"
            />
            <Select
              options={actionTypeOptions}
              value={actionFilter}
              onChange={setActionFilter}
              className="w-56"
            />
            <Select
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onChange={setDateRange}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        pageSize={15}
        emptyMessage="Нет записей в журнале аудита"
      />
    </div>
  );
}
