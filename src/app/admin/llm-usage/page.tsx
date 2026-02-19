'use client';

import { useState, useMemo } from 'react';
import {
  Brain,
  Zap,
  DollarSign,
  Clock,
  Hash,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useStore } from '@/store/useStore';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Fallback user map for displaying user names
const USER_MAP: Record<string, string> = {
  'user-1': 'Иванов А.С.',
  'user-2': 'Петрова М.К.',
  'user-3': 'Сидоров В.Н.',
  'user-4': 'Козлова Д.А.',
  'user-5': 'Морозов К.Л.',
  'user-6': 'Новикова Е.В.',
  'user-7': 'Волков И.П.',
  'user-8': 'Соколов А.М.',
  'user-9': 'Фёдоров Р.С.',
};

const MODEL_FILTER_OPTIONS = [
  { value: 'all', label: 'Все модели' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Последние 7 дней' },
  { value: '30', label: 'Последние 30 дней' },
  { value: 'all', label: 'Все' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LLMUsagePage() {
  const store = useStore();
  const llmUsage: any[] = (store as any).llmUsage || [];

  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Build unique user options for filter
  const userFilterOptions = useMemo(() => {
    const uniqueUsers = new Set(llmUsage.map((entry: any) => entry.userId));
    const opts = [{ value: 'all', label: 'Все пользователи' }];
    for (const userId of uniqueUsers) {
      opts.push({
        value: userId,
        label: USER_MAP[userId] || userId,
      });
    }
    return opts;
  }, [llmUsage]);

  const [userFilter, setUserFilter] = useState('all');

  // Summary stats
  const summary = useMemo(() => {
    const totalCalls = llmUsage.length;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;

    for (const entry of llmUsage) {
      totalInputTokens += entry.inputTokens || 0;
      totalOutputTokens += entry.outputTokens || 0;
      totalCost += entry.cost || 0;
      totalLatency += entry.latency || 0;
    }

    const avgLatency = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;
    const totalTokens = totalInputTokens + totalOutputTokens;

    return {
      totalCalls,
      totalTokens,
      totalCost,
      avgLatency,
    };
  }, [llmUsage]);

  // Daily cost trend (aggregate by date)
  const dailyCostData = useMemo(() => {
    const costByDate: Record<string, number> = {};

    for (const entry of llmUsage) {
      if (!entry.timestamp) continue;
      const date = entry.timestamp.substring(0, 10); // YYYY-MM-DD
      costByDate[date] = (costByDate[date] || 0) + (entry.cost || 0);
    }

    // Sort by date and take last 30 entries
    return Object.entries(costByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, cost]) => ({
        date: new Date(date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        }),
        cost: parseFloat(cost.toFixed(4)),
      }));
  }, [llmUsage]);

  // Filtered data for the table
  const filteredData = useMemo(() => {
    let data = [...llmUsage];

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      data = data.filter((entry: any) => new Date(entry.timestamp) >= cutoff);
    }

    // Filter by model
    if (modelFilter !== 'all') {
      data = data.filter((entry: any) => entry.model === modelFilter);
    }

    // Filter by user
    if (userFilter !== 'all') {
      data = data.filter((entry: any) => entry.userId === userFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (entry: any) =>
          (entry.model || '').toLowerCase().includes(q) ||
          (USER_MAP[entry.userId] || entry.userId || '').toLowerCase().includes(q) ||
          (entry.templateType || '').toLowerCase().includes(q)
      );
    }

    // Sort by timestamp descending
    data.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return data;
  }, [llmUsage, search, modelFilter, userFilter, dateRange]);

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
      key: 'userId',
      title: 'Пользователь',
      sortable: true,
      render: (value: string) => USER_MAP[value] || value || '\u2014',
    },
    {
      key: 'model',
      title: 'Модель',
      sortable: true,
      render: (value: string) => (
        <Badge variant="purple">{value || '\u2014'}</Badge>
      ),
    },
    {
      key: 'inputTokens',
      title: 'Вх. токены',
      sortable: true,
      render: (value: number) =>
        value != null ? value.toLocaleString('ru-RU') : '\u2014',
    },
    {
      key: 'outputTokens',
      title: 'Вых. токены',
      sortable: true,
      render: (value: number) =>
        value != null ? value.toLocaleString('ru-RU') : '\u2014',
    },
    {
      key: 'cost',
      title: 'Стоимость ($)',
      sortable: true,
      render: (value: number) =>
        value != null ? `$${value.toFixed(4)}` : '\u2014',
    },
    {
      key: 'latency',
      title: 'Задержка (мс)',
      sortable: true,
      render: (value: number) =>
        value != null ? `${value.toLocaleString('ru-RU')} мс` : '\u2014',
    },
    {
      key: 'templateType',
      title: 'Тип шаблона',
      sortable: true,
      render: (value: string) =>
        value ? (
          <Badge variant="default">{value}</Badge>
        ) : (
          '\u2014'
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
        <Brain className="h-7 w-7 text-amber-600" />
        Использование LLM
      </h1>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Всего вызовов"
          value={summary.totalCalls}
          change="За весь период"
          trend="neutral"
          icon={<Hash className="h-5 w-5" />}
        />
        <KPICard
          title="Всего токенов"
          value={summary.totalTokens.toLocaleString('ru-RU')}
          change="Вх. + Вых."
          trend="neutral"
          icon={<Zap className="h-5 w-5" />}
        />
        <KPICard
          title="Общая стоимость"
          value={`$${summary.totalCost.toFixed(2)}`}
          change="USD"
          trend="neutral"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title="Средн. задержка"
          value={`${summary.avgLatency} мс`}
          change="Среднее время"
          trend="neutral"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Daily cost chart */}
      <Card>
        <CardHeader>
          <CardTitle>Стоимость по дням (последние 30 дней)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyCostData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Нет данных для отображения графика
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                    formatter={(value: number | undefined) => [
                      `$${(value ?? 0).toFixed(4)}`,
                      'Стоимость',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Стоимость"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Поиск по модели, пользователю, шаблону..."
              className="flex-1"
            />
            <Select
              options={MODEL_FILTER_OPTIONS}
              value={modelFilter}
              onChange={setModelFilter}
              className="w-48"
            />
            <Select
              options={userFilterOptions}
              value={userFilter}
              onChange={setUserFilter}
              className="w-52"
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
        emptyMessage="Нет данных об использовании LLM"
      />
    </div>
  );
}
