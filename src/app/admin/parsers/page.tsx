'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Plus, Play, Square, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Parser {
  id: string;
  name: string;
  sourceUrl: string;
  status: 'running' | 'stopped' | 'error';
  lastRun?: string;
  sourceType?: string;
}

interface ParserRun {
  id: string;
  parserId: string;
  status: 'success' | 'error' | 'partial';
  startedAt: string;
  completedAt?: string;
  recordsFound?: number;
  recordsNew?: number;
  recordsUpdated?: number;
  recordsSkipped?: number;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Default mock parsers (fallback if store is empty)
// ---------------------------------------------------------------------------

const DEFAULT_PARSERS: Parser[] = [
  {
    id: 'parser-1',
    name: 'Государственная Дума — RSS',
    sourceUrl: 'https://duma.gov.ru/rss/news/',
    status: 'running',
    lastRun: '2026-02-19T08:30:00Z',
    sourceType: 'rss',
  },
  {
    id: 'parser-2',
    name: 'Минцифры — Новости',
    sourceUrl: 'https://digital.gov.ru/ru/events/',
    status: 'running',
    lastRun: '2026-02-19T07:45:00Z',
    sourceType: 'html',
  },
  {
    id: 'parser-3',
    name: 'Regulation.gov.ru API',
    sourceUrl: 'https://regulation.gov.ru/api/v1/',
    status: 'stopped',
    lastRun: '2026-02-18T23:00:00Z',
    sourceType: 'api',
  },
  {
    id: 'parser-4',
    name: 'Telegram — GR Мониторинг',
    sourceUrl: 'https://t.me/gr_monitoring',
    status: 'error',
    lastRun: '2026-02-19T06:00:00Z',
    sourceType: 'telegram',
  },
  {
    id: 'parser-5',
    name: 'ФАС России — Решения',
    sourceUrl: 'https://fas.gov.ru/documents',
    status: 'running',
    lastRun: '2026-02-19T09:00:00Z',
    sourceType: 'html',
  },
];

const DEFAULT_PARSER_RUNS: ParserRun[] = [
  { id: 'run-1', parserId: 'parser-1', status: 'success', startedAt: '2026-02-19T08:30:00Z', completedAt: '2026-02-19T08:30:45Z', recordsFound: 12, recordsNew: 3, recordsUpdated: 2, recordsSkipped: 7 },
  { id: 'run-2', parserId: 'parser-1', status: 'success', startedAt: '2026-02-19T07:30:00Z', completedAt: '2026-02-19T07:30:38Z', recordsFound: 10, recordsNew: 1, recordsUpdated: 1, recordsSkipped: 8 },
  { id: 'run-3', parserId: 'parser-2', status: 'success', startedAt: '2026-02-19T07:45:00Z', completedAt: '2026-02-19T07:46:12Z', recordsFound: 8, recordsNew: 2, recordsUpdated: 0, recordsSkipped: 6 },
  { id: 'run-4', parserId: 'parser-2', status: 'error', startedAt: '2026-02-19T06:45:00Z', completedAt: '2026-02-19T06:45:05Z', recordsFound: 0, recordsNew: 0, recordsUpdated: 0, recordsSkipped: 0, errorMessage: 'Connection timeout' },
  { id: 'run-5', parserId: 'parser-3', status: 'success', startedAt: '2026-02-18T23:00:00Z', completedAt: '2026-02-18T23:01:30Z', recordsFound: 25, recordsNew: 5, recordsUpdated: 3, recordsSkipped: 17 },
  { id: 'run-6', parserId: 'parser-4', status: 'error', startedAt: '2026-02-19T06:00:00Z', completedAt: '2026-02-19T06:00:03Z', recordsFound: 0, recordsNew: 0, recordsUpdated: 0, recordsSkipped: 0, errorMessage: 'Auth token expired' },
  { id: 'run-7', parserId: 'parser-4', status: 'error', startedAt: '2026-02-19T05:00:00Z', completedAt: '2026-02-19T05:00:02Z', recordsFound: 0, recordsNew: 0, recordsUpdated: 0, recordsSkipped: 0, errorMessage: 'Auth token expired' },
  { id: 'run-8', parserId: 'parser-5', status: 'success', startedAt: '2026-02-19T09:00:00Z', completedAt: '2026-02-19T09:01:05Z', recordsFound: 15, recordsNew: 4, recordsUpdated: 1, recordsSkipped: 10 },
  { id: 'run-9', parserId: 'parser-5', status: 'success', startedAt: '2026-02-19T08:00:00Z', completedAt: '2026-02-19T08:00:55Z', recordsFound: 14, recordsNew: 2, recordsUpdated: 0, recordsSkipped: 12 },
  { id: 'run-10', parserId: 'parser-1', status: 'success', startedAt: '2026-02-19T06:30:00Z', completedAt: '2026-02-19T06:30:40Z', recordsFound: 11, recordsNew: 2, recordsUpdated: 1, recordsSkipped: 8 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return '\u2014';
  try {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '\u2014';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminParsersPage() {
  const router = useRouter();
  const storeState = useStore() as any;

  const parsers: Parser[] = storeState.parsers || DEFAULT_PARSERS;
  const parserRuns: ParserRun[] = storeState.parserRuns || DEFAULT_PARSER_RUNS;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Quick stats
  const runningCount = useMemo(() => parsers.filter((p) => p.status === 'running').length, [parsers]);
  const stoppedCount = useMemo(() => parsers.filter((p) => p.status === 'stopped').length, [parsers]);
  const errorCount = useMemo(() => parsers.filter((p) => p.status === 'error').length, [parsers]);

  // Success rate per parser
  const successRateMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of parsers) {
      const runs = parserRuns.filter((r) => r.parserId === p.id);
      if (runs.length === 0) {
        map[p.id] = 0;
        continue;
      }
      const successCount = runs.filter((r) => r.status === 'success').length;
      map[p.id] = Math.round((successCount / runs.length) * 100);
    }
    return map;
  }, [parsers, parserRuns]);

  // Records 24h per parser
  const records24hMap = useMemo(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    for (const p of parsers) {
      const runs = parserRuns.filter(
        (r) => r.parserId === p.id && new Date(r.startedAt).getTime() > dayAgo
      );
      map[p.id] = runs.reduce((sum, r) => sum + (r.recordsNew || 0), 0);
    }
    return map;
  }, [parsers, parserRuns]);

  const handleToggle = (parser: Parser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (parser.status === 'running') {
      toast.success(`Парсер "${parser.name}" остановлен`);
    } else {
      toast.success(`Парсер "${parser.name}" запущен`);
    }
  };

  const handleRunNow = (parser: Parser, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Парсер "${parser.name}" запущен вручную`);
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: 'Название',
        sortable: true,
        render: (val: string) => (
          <span className="font-medium text-gray-900">{val}</span>
        ),
      },
      {
        key: 'sourceUrl',
        title: 'Источник',
        sortable: false,
        render: (val: string) => (
          <span className="block max-w-[200px] truncate text-sm text-gray-500" title={val}>
            {val}
          </span>
        ),
      },
      {
        key: 'status',
        title: 'Статус',
        sortable: true,
        render: (val: string) => {
          const config: Record<string, { variant: 'green' | 'default' | 'red'; label: string; dot: string }> = {
            running: { variant: 'green', label: 'Работает', dot: 'bg-green-500' },
            stopped: { variant: 'default', label: 'Остановлен', dot: 'bg-gray-400' },
            error: { variant: 'red', label: 'Ошибка', dot: 'bg-red-500' },
          };
          const c = config[val] || config.stopped;
          return (
            <Badge variant={c.variant}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${c.dot}`} />
              {c.label}
            </Badge>
          );
        },
      },
      {
        key: 'lastRun',
        title: 'Последний запуск',
        sortable: true,
        render: (val: string) => (
          <span className="text-sm text-gray-600">{formatDate(val)}</span>
        ),
      },
      {
        key: 'id',
        title: 'Успешность',
        sortable: false,
        render: (_val: string, row: Parser) => {
          const rate = successRateMap[row.id] ?? 0;
          const color = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600';
          return <span className={`text-sm font-medium ${color}`}>{rate}%</span>;
        },
      },
      {
        key: 'id',
        title: 'Записей 24ч',
        sortable: false,
        render: (_val: string, row: Parser) => (
          <span className="text-sm text-gray-600">{records24hMap[row.id] ?? 0}</span>
        ),
      },
      {
        key: 'actions',
        title: 'Действия',
        sortable: false,
        render: (_val: any, row: Parser) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleToggle(row, e)}
              title={row.status === 'running' ? 'Остановить' : 'Запустить'}
            >
              {row.status === 'running' ? (
                <Square className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <Play className="h-3.5 w-3.5 text-green-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleRunNow(row, e)}
              title="Запустить сейчас"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          </div>
        ),
      },
    ],
    [successRateMap, records24hMap]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
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
          { label: 'Парсеры' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Парсеры данных</h1>
          <Badge variant="default">{parsers.length}</Badge>
        </div>
        <Button onClick={() => router.push('/admin/parsers/new')}>
          <Plus className="h-4 w-4" />
          Добавить парсер
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Работают</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{runningCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Play className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Остановлены</p>
              <p className="mt-1 text-2xl font-bold text-gray-700">{stoppedCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
              <Square className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Ошибки</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{errorCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Database className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={parsers}
        onRowClick={(row) => router.push(`/admin/parsers/${row.id}`)}
        pageSize={10}
        emptyMessage="Парсеры не найдены"
      />
    </div>
  );
}
