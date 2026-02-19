'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Play,
  Square,
  RefreshCw,
  Activity,
  AlertTriangle,
  FileText,
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
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
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/ui/data-table';
import { KPICard } from '@/components/ui/kpi-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
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
  schedule?: string;
  authType?: string;
  titleSelector?: string;
  summarySelector?: string;
  dateSelector?: string;
  topicClassification?: string;
  riskAssessment?: boolean;
  deduplication?: boolean;
  dedupStrategy?: string;
  notifications?: boolean;
  enabled?: boolean;
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
// Default mock data
// ---------------------------------------------------------------------------

const DEFAULT_PARSERS: Parser[] = [
  { id: 'parser-1', name: 'Государственная Дума — RSS', sourceUrl: 'https://duma.gov.ru/rss/news/', status: 'running', lastRun: '2026-02-19T08:30:00Z', sourceType: 'rss', schedule: '0 * * * *', authType: 'none', riskAssessment: true, deduplication: true, dedupStrategy: 'title', notifications: true, enabled: true },
  { id: 'parser-2', name: 'Минцифры — Новости', sourceUrl: 'https://digital.gov.ru/ru/events/', status: 'running', lastRun: '2026-02-19T07:45:00Z', sourceType: 'html', schedule: '*/30 * * * *', authType: 'none', riskAssessment: false, deduplication: true, dedupStrategy: 'url', notifications: true, enabled: true },
  { id: 'parser-3', name: 'Regulation.gov.ru API', sourceUrl: 'https://regulation.gov.ru/api/v1/', status: 'stopped', lastRun: '2026-02-18T23:00:00Z', sourceType: 'api', schedule: '0 0 * * *', authType: 'api_key', riskAssessment: true, deduplication: true, dedupStrategy: 'hash', notifications: false, enabled: false },
  { id: 'parser-4', name: 'Telegram — GR Мониторинг', sourceUrl: 'https://t.me/gr_monitoring', status: 'error', lastRun: '2026-02-19T06:00:00Z', sourceType: 'telegram', schedule: '*/15 * * * *', authType: 'oauth', riskAssessment: false, deduplication: false, dedupStrategy: 'title', notifications: true, enabled: true },
  { id: 'parser-5', name: 'ФАС России — Решения', sourceUrl: 'https://fas.gov.ru/documents', status: 'running', lastRun: '2026-02-19T09:00:00Z', sourceType: 'html', schedule: '0 * * * *', authType: 'none', riskAssessment: true, deduplication: true, dedupStrategy: 'url', notifications: true, enabled: true },
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
  { id: 'run-11', parserId: 'parser-1', status: 'error', startedAt: '2026-02-19T05:30:00Z', completedAt: '2026-02-19T05:30:04Z', recordsFound: 0, recordsNew: 0, recordsUpdated: 0, recordsSkipped: 0, errorMessage: 'DNS resolution failed' },
  { id: 'run-12', parserId: 'parser-5', status: 'partial', startedAt: '2026-02-19T07:00:00Z', completedAt: '2026-02-19T07:01:20Z', recordsFound: 10, recordsNew: 1, recordsUpdated: 0, recordsSkipped: 9, errorMessage: 'Partial: 2 pages failed' },
];

// Mock output records
const MOCK_OUTPUT_RECORDS = [
  { id: 'rec-1', title: 'Проект федерального закона о регулировании цифровых платформ', sourceUrl: 'https://duma.gov.ru/news/58234/', dateParsed: '2026-02-19T08:30:00Z', status: 'new', riskScore: 'high' },
  { id: 'rec-2', title: 'Поправки к закону о персональных данных (ФЗ-152)', sourceUrl: 'https://regulation.gov.ru/p/142568', dateParsed: '2026-02-19T08:30:10Z', status: 'new', riskScore: 'high' },
  { id: 'rec-3', title: 'О внесении изменений в закон о связи в части 5G-частот', sourceUrl: 'https://duma.gov.ru/news/58201/', dateParsed: '2026-02-19T07:30:00Z', status: 'updated', riskScore: 'medium' },
  { id: 'rec-4', title: 'Минцифры утвердило новые требования к хранению данных', sourceUrl: 'https://digital.gov.ru/ru/events/12345/', dateParsed: '2026-02-19T07:45:00Z', status: 'new', riskScore: 'medium' },
  { id: 'rec-5', title: 'ФАС возбудила дело о нарушении антимонопольного законодательства', sourceUrl: 'https://fas.gov.ru/documents/789456', dateParsed: '2026-02-19T09:00:00Z', status: 'new', riskScore: 'high' },
  { id: 'rec-6', title: 'Об установлении тарифов на услуги связи общего пользования', sourceUrl: 'https://regulation.gov.ru/p/142600', dateParsed: '2026-02-18T23:00:00Z', status: 'duplicate', riskScore: 'low' },
  { id: 'rec-7', title: 'Изменения в порядке лицензирования телеком-операторов', sourceUrl: 'https://digital.gov.ru/ru/events/12350/', dateParsed: '2026-02-18T23:00:30Z', status: 'updated', riskScore: 'medium' },
  { id: 'rec-8', title: 'Проект постановления о кибербезопасности КИИ', sourceUrl: 'https://regulation.gov.ru/p/142610', dateParsed: '2026-02-18T23:01:00Z', status: 'new', riskScore: 'high' },
  { id: 'rec-9', title: 'О цифровизации государственных услуг — второе чтение', sourceUrl: 'https://duma.gov.ru/news/58190/', dateParsed: '2026-02-19T06:30:00Z', status: 'duplicate', riskScore: 'low' },
  { id: 'rec-10', title: 'Регулирование OTT-сервисов: новый законопроект', sourceUrl: 'https://duma.gov.ru/news/58220/', dateParsed: '2026-02-19T08:30:20Z', status: 'new', riskScore: 'medium' },
];

// Mock errors
const MOCK_ERRORS = [
  { id: 'err-1', timestamp: '2026-02-19T06:00:03Z', type: 'auth', message: 'Auth token expired for Telegram channel parser', details: 'OAuth2 refresh token is invalid or expired. Token was issued on 2026-01-15 and has a 30-day validity period. Please re-authenticate through the Telegram Bot API settings.' },
  { id: 'err-2', timestamp: '2026-02-19T05:00:02Z', type: 'auth', message: 'Auth token expired for Telegram channel parser', details: 'Same issue as above. Consecutive auth failures detected.' },
  { id: 'err-3', timestamp: '2026-02-19T06:45:05Z', type: 'timeout', message: 'Connection timeout to digital.gov.ru', details: 'TCP connection timed out after 30000ms. The remote server did not respond within the configured timeout. This may be due to server maintenance or network issues.' },
  { id: 'err-4', timestamp: '2026-02-19T05:30:04Z', type: 'parse', message: 'DNS resolution failed for duma.gov.ru', details: 'NXDOMAIN error when resolving duma.gov.ru. DNS server returned no results. This was a temporary DNS issue that resolved after 15 minutes.' },
  { id: 'err-5', timestamp: '2026-02-18T22:00:10Z', type: 'validation', message: 'Invalid date format in parsed record', details: 'Expected date format YYYY-MM-DD but received "19 февраля 2026" in field "publishDate". Record was skipped. Consider updating the date parser configuration.' },
];

// ---------------------------------------------------------------------------
// Options for settings tab
// ---------------------------------------------------------------------------

const SOURCE_TYPE_OPTIONS = [
  { value: 'rss', label: 'RSS Feed' },
  { value: 'html', label: 'HTML Scraper' },
  { value: 'api', label: 'API Endpoint' },
  { value: 'telegram', label: 'Telegram Channel' },
  { value: 'custom', label: 'Custom' },
];

const SCHEDULE_OPTIONS = [
  { value: '*/15 * * * *', label: 'Каждые 15 мин' },
  { value: '*/30 * * * *', label: 'Каждые 30 мин' },
  { value: '0 * * * *', label: 'Каждый час' },
  { value: '0 0 * * *', label: 'Ежедневно' },
  { value: 'custom', label: 'Свой cron' },
];

const AUTH_TYPE_OPTIONS = [
  { value: 'none', label: 'Нет' },
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth', label: 'OAuth' },
  { value: 'basic', label: 'Basic Auth' },
];

const TOPIC_CLASSIFICATION_OPTIONS = [
  { value: 'keywords', label: 'По ключевым словам' },
  { value: 'llm', label: 'С помощью LLM' },
];

const DEDUP_STRATEGY_OPTIONS = [
  { value: 'title', label: 'По заголовку' },
  { value: 'url', label: 'По URL' },
  { value: 'hash', label: 'По хешу контента' },
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

function computeDuration(start: string, end?: string): string {
  if (!end) return '\u2014';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 1000) return `${diff}мс`;
  return `${(diff / 1000).toFixed(1)}с`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminParserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const parserId = params.id as string;

  const storeState = useStore() as any;
  const parsers: Parser[] = storeState.parsers || DEFAULT_PARSERS;
  const parserRuns: ParserRun[] = storeState.parserRuns || DEFAULT_PARSER_RUNS;

  const parser = useMemo(() => parsers.find((p) => p.id === parserId), [parsers, parserId]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsSourceType, setSettingsSourceType] = useState('rss');
  const [settingsSourceUrl, setSettingsSourceUrl] = useState('');
  const [settingsSchedule, setSettingsSchedule] = useState('0 * * * *');
  const [settingsCustomCron, setSettingsCustomCron] = useState('');
  const [settingsAuthType, setSettingsAuthType] = useState('none');
  const [settingsCredentials, setSettingsCredentials] = useState('');
  const [settingsTitleSelector, setSettingsTitleSelector] = useState('');
  const [settingsSummarySelector, setSettingsSummarySelector] = useState('');
  const [settingsDateSelector, setSettingsDateSelector] = useState('');
  const [settingsTopicClassification, setSettingsTopicClassification] = useState('keywords');
  const [settingsRiskAssessment, setSettingsRiskAssessment] = useState(false);
  const [settingsDeduplication, setSettingsDeduplication] = useState(true);
  const [settingsDedupStrategy, setSettingsDedupStrategy] = useState('title');
  const [settingsNotifications, setSettingsNotifications] = useState(true);
  const [settingsEnabled, setSettingsEnabled] = useState(true);

  // Initialize settings from parser
  useEffect(() => {
    if (parser) {
      setSettingsName(parser.name);
      setSettingsSourceType(parser.sourceType || 'rss');
      setSettingsSourceUrl(parser.sourceUrl);
      setSettingsSchedule(parser.schedule || '0 * * * *');
      setSettingsAuthType(parser.authType || 'none');
      setSettingsTitleSelector(parser.titleSelector || '');
      setSettingsSummarySelector(parser.summarySelector || '');
      setSettingsDateSelector(parser.dateSelector || '');
      setSettingsTopicClassification(parser.topicClassification || 'keywords');
      setSettingsRiskAssessment(parser.riskAssessment ?? false);
      setSettingsDeduplication(parser.deduplication ?? true);
      setSettingsDedupStrategy(parser.dedupStrategy || 'title');
      setSettingsNotifications(parser.notifications ?? true);
      setSettingsEnabled(parser.enabled ?? true);
    }
  }, [parser]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Computed data for overview
  const runs = useMemo(
    () => parserRuns.filter((r) => r.parserId === parserId),
    [parserRuns, parserId]
  );

  const totalRecords = useMemo(
    () => runs.reduce((sum, r) => sum + (r.recordsNew || 0) + (r.recordsUpdated || 0), 0),
    [runs]
  );

  const successRate = useMemo(() => {
    if (runs.length === 0) return 0;
    return Math.round((runs.filter((r) => r.status === 'success').length / runs.length) * 100);
  }, [runs]);

  const errors24h = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return runs.filter(
      (r) => r.status === 'error' && new Date(r.startedAt).getTime() > dayAgo
    ).length;
  }, [runs]);

  // Chart data: activity over 14 days
  const activityChartData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        day: `${i + 5} фев`,
        records: Math.floor(Math.random() * 30) + 5,
      })),
    []
  );

  const errorChartData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        day: `${i + 5} фев`,
        errors: Math.floor(Math.random() * 5),
      })),
    []
  );

  // Logs filtered
  const filteredRuns = useMemo(() => {
    if (!logStatusFilter) return runs;
    return runs.filter((r) => r.status === logStatusFilter);
  }, [runs, logStatusFilter]);

  const toggleError = (id: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggle = () => {
    if (!parser) return;
    if (parser.status === 'running') {
      toast.success(`Парсер "${parser.name}" остановлен`);
    } else {
      toast.success(`Парсер "${parser.name}" запущен`);
    }
  };

  const handleRunNow = () => {
    if (!parser) return;
    toast.success(`Парсер "${parser.name}" запущен вручную`);
  };

  const handleSaveSettings = () => {
    toast.success('Настройки парсера сохранены');
  };

  const handleTestRun = () => {
    toast.success('Тестовый запуск парсера начат...');
  };

  const handleDelete = () => {
    setDeleteModalOpen(false);
    toast.success(`Парсер "${parser?.name}" удалён`);
    router.push('/admin/parsers');
  };

  const handleRetryFailed = () => {
    toast.success('Повторный запуск ошибочных задач...');
  };

  // Status config
  const statusConfig: Record<string, { variant: 'green' | 'default' | 'red'; label: string; dot: string }> = {
    running: { variant: 'green', label: 'Работает', dot: 'bg-green-500' },
    stopped: { variant: 'default', label: 'Остановлен', dot: 'bg-gray-400' },
    error: { variant: 'red', label: 'Ошибка', dot: 'bg-red-500' },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!parser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Парсер не найден</h2>
        <p className="mt-1 text-sm text-gray-500">Парсер с ID &quot;{parserId}&quot; не существует.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/parsers')}>
          Назад к списку
        </Button>
      </div>
    );
  }

  const sc = statusConfig[parser.status] || statusConfig.stopped;

  // Logs columns
  const logsColumns = [
    {
      key: 'startedAt',
      title: 'Время',
      sortable: true,
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDate(val)}</span>
      ),
    },
    {
      key: 'startedAt',
      title: 'Длительность',
      sortable: false,
      render: (_val: string, row: ParserRun) => (
        <span className="text-sm text-gray-600">{computeDuration(row.startedAt, row.completedAt)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: true,
      render: (val: string) => {
        const variants: Record<string, 'green' | 'red' | 'yellow'> = {
          success: 'green',
          error: 'red',
          partial: 'yellow',
        };
        const labels: Record<string, string> = {
          success: 'Успех',
          error: 'Ошибка',
          partial: 'Частично',
        };
        return <Badge variant={variants[val] || 'default'}>{labels[val] || val}</Badge>;
      },
    },
    {
      key: 'recordsFound',
      title: 'Найдено',
      sortable: true,
      render: (val: number) => <span className="text-sm text-gray-600">{val ?? 0}</span>,
    },
    {
      key: 'recordsNew',
      title: 'Новых',
      sortable: true,
      render: (val: number) => <span className="text-sm font-medium text-green-600">{val ?? 0}</span>,
    },
    {
      key: 'recordsUpdated',
      title: 'Обновлено',
      sortable: false,
      render: (val: number) => <span className="text-sm text-blue-600">{val ?? 0}</span>,
    },
    {
      key: 'recordsSkipped',
      title: 'Пропущено',
      sortable: false,
      render: (val: number) => <span className="text-sm text-gray-400">{val ?? 0}</span>,
    },
    {
      key: 'errorMessage',
      title: 'Ошибка',
      sortable: false,
      render: (val: string) =>
        val ? (
          <span className="block max-w-[200px] truncate text-sm text-red-600" title={val}>
            {val}
          </span>
        ) : (
          <span className="text-sm text-gray-400">{'\u2014'}</span>
        ),
    },
  ];

  // Output columns
  const outputColumns = [
    {
      key: 'title',
      title: 'Заголовок',
      sortable: true,
      render: (val: string) => (
        <span className="block max-w-[300px] truncate font-medium text-gray-900" title={val}>
          {val}
        </span>
      ),
    },
    {
      key: 'sourceUrl',
      title: 'Источник',
      sortable: false,
      render: (val: string) => (
        <span className="block max-w-[180px] truncate text-sm text-gray-500" title={val}>
          {val}
        </span>
      ),
    },
    {
      key: 'dateParsed',
      title: 'Дата',
      sortable: true,
      render: (val: string) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: true,
      render: (val: string) => {
        const variants: Record<string, 'green' | 'blue' | 'default'> = {
          new: 'green',
          updated: 'blue',
          duplicate: 'default',
        };
        const labels: Record<string, string> = {
          new: 'Новый',
          updated: 'Обновлён',
          duplicate: 'Дубликат',
        };
        return <Badge variant={variants[val] || 'default'}>{labels[val] || val}</Badge>;
      },
    },
    {
      key: 'riskScore',
      title: 'Риск',
      sortable: true,
      render: (val: string) => {
        const variants: Record<string, 'red' | 'yellow' | 'green'> = {
          high: 'red',
          medium: 'yellow',
          low: 'green',
        };
        const labels: Record<string, string> = {
          high: 'Высокий',
          medium: 'Средний',
          low: 'Низкий',
        };
        return <Badge variant={variants[val] || 'default'}>{labels[val] || val}</Badge>;
      },
    },
  ];

  // Error type counts for Errors tab
  const errorTypeCounts = {
    timeout: MOCK_ERRORS.filter((e) => e.type === 'timeout').length,
    parse: MOCK_ERRORS.filter((e) => e.type === 'parse').length,
    auth: MOCK_ERRORS.filter((e) => e.type === 'auth').length,
    validation: MOCK_ERRORS.filter((e) => e.type === 'validation').length,
  };

  const errorTypeBadgeVariant: Record<string, 'red' | 'yellow' | 'orange' | 'purple'> = {
    timeout: 'red',
    parse: 'orange',
    auth: 'yellow',
    validation: 'purple',
  };

  const errorTypeLabels: Record<string, string> = {
    timeout: 'Connection Timeout',
    parse: 'Parse Error',
    auth: 'Auth Failure',
    validation: 'Validation',
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Парсеры', href: '/admin/parsers' },
          { label: parser.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{parser.name}</h1>
          <Badge variant={sc.variant}>
            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${sc.dot}`} />
            {sc.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggle}>
            {parser.status === 'running' ? (
              <>
                <Square className="h-4 w-4" />
                Остановить
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Запустить
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRunNow}>
            <RefreshCw className="h-4 w-4" />
            Запустить сейчас
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="logs">Логи</TabsTrigger>
          <TabsTrigger value="output">Результаты</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        {/* ====== Overview Tab ====== */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Всего записей"
                value={totalRecords}
                trend="up"
                change="За все время"
                icon={<FileText className="h-5 w-5" />}
              />
              <KPICard
                title="Успешность"
                value={`${successRate}%`}
                trend={successRate >= 80 ? 'up' : successRate >= 50 ? 'neutral' : 'down'}
                change={`${runs.length} запусков`}
                icon={<Activity className="h-5 w-5" />}
              />
              <KPICard
                title="Ср. время парсинга"
                value="2.3 сек"
                trend="neutral"
                change="Стабильно"
                icon={<RefreshCw className="h-5 w-5" />}
              />
              <KPICard
                title="Ошибок 24ч"
                value={errors24h}
                trend={errors24h > 0 ? 'down' : 'up'}
                change={errors24h > 0 ? 'Требует внимания' : 'Всё в порядке'}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Активность парсера</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            fontSize: '13px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="records"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Записей"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Частота ошибок</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={errorChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            fontSize: '13px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="errors"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Ошибок"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ====== Logs Tab ====== */}
        <TabsContent value="logs">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                options={[
                  { value: '', label: 'Все статусы' },
                  { value: 'success', label: 'Успех' },
                  { value: 'error', label: 'Ошибка' },
                  { value: 'partial', label: 'Частично' },
                ]}
                value={logStatusFilter}
                onChange={setLogStatusFilter}
                className="w-48"
              />
              <span className="text-sm text-gray-500">
                {filteredRuns.length} записей
              </span>
            </div>
            <DataTable
              columns={logsColumns}
              data={filteredRuns}
              pageSize={10}
              emptyMessage="Логи не найдены"
            />
          </div>
        </TabsContent>

        {/* ====== Output Tab ====== */}
        <TabsContent value="output">
          <DataTable
            columns={outputColumns}
            data={MOCK_OUTPUT_RECORDS}
            pageSize={10}
            emptyMessage="Записей не найдено"
          />
        </TabsContent>

        {/* ====== Errors Tab ====== */}
        <TabsContent value="errors">
          <div className="space-y-6">
            {/* Error type breakdown */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{errorTypeCounts.timeout}</p>
                <p className="mt-1 text-xs font-medium text-red-600">Connection Timeout</p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{errorTypeCounts.parse}</p>
                <p className="mt-1 text-xs font-medium text-orange-600">Parse Error</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{errorTypeCounts.auth}</p>
                <p className="mt-1 text-xs font-medium text-yellow-600">Auth Failure</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{errorTypeCounts.validation}</p>
                <p className="mt-1 text-xs font-medium text-purple-600">Validation</p>
              </div>
            </div>

            {/* Error list */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Последние ошибки</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleRetryFailed}>
                    <RefreshCw className="h-4 w-4" />
                    Повторить ошибочные
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {MOCK_ERRORS.map((error) => (
                    <div key={error.id} className="py-3">
                      <div
                        className="flex cursor-pointer items-center gap-3"
                        onClick={() => toggleError(error.id)}
                      >
                        {expandedErrors.has(error.id) ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-400 w-36 flex-shrink-0">
                          {formatDate(error.timestamp)}
                        </span>
                        <Badge variant={errorTypeBadgeVariant[error.type] || 'default'}>
                          {errorTypeLabels[error.type] || error.type}
                        </Badge>
                        <span className="text-sm text-gray-700 truncate">{error.message}</span>
                      </div>
                      {expandedErrors.has(error.id) && (
                        <div className="mt-2 ml-7 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{error.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== Settings Tab ====== */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6 space-y-8">
              {/* Basic Info */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Основная информация</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Название парсера
                    </label>
                    <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Тип источника</label>
                    <Select
                      options={SOURCE_TYPE_OPTIONS}
                      value={settingsSourceType}
                      onChange={setSettingsSourceType}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500">URL источника</label>
                    <Input value={settingsSourceUrl} onChange={(e) => setSettingsSourceUrl(e.target.value)} />
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Schedule */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Расписание</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Расписание</label>
                    <Select
                      options={SCHEDULE_OPTIONS}
                      value={settingsSchedule}
                      onChange={setSettingsSchedule}
                    />
                  </div>
                  {settingsSchedule === 'custom' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Cron выражение</label>
                      <Input
                        value={settingsCustomCron}
                        onChange={(e) => setSettingsCustomCron(e.target.value)}
                        placeholder="*/10 * * * *"
                      />
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Authentication */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Аутентификация</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Тип аутентификации</label>
                    <Select
                      options={AUTH_TYPE_OPTIONS}
                      value={settingsAuthType}
                      onChange={setSettingsAuthType}
                    />
                  </div>
                  {settingsAuthType !== 'none' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Учётные данные</label>
                      <Input
                        type="password"
                        value={settingsCredentials}
                        onChange={(e) => setSettingsCredentials(e.target.value)}
                        placeholder="API ключ или пароль"
                      />
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Data Mapping */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Маппинг данных</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Селектор заголовка</label>
                    <Input
                      value={settingsTitleSelector}
                      onChange={(e) => setSettingsTitleSelector(e.target.value)}
                      placeholder="CSS selector or JSON path"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Селектор описания</label>
                    <Input
                      value={settingsSummarySelector}
                      onChange={(e) => setSettingsSummarySelector(e.target.value)}
                      placeholder="CSS selector or JSON path"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Селектор даты</label>
                    <Input
                      value={settingsDateSelector}
                      onChange={(e) => setSettingsDateSelector(e.target.value)}
                      placeholder="CSS selector or JSON path"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Классификация тем</label>
                    <Select
                      options={TOPIC_CLASSIFICATION_OPTIONS}
                      value={settingsTopicClassification}
                      onChange={setSettingsTopicClassification}
                    />
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Options */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Опции</h2>
                <div className="space-y-5">
                  <div>
                    <Switch
                      checked={settingsRiskAssessment}
                      onChange={setSettingsRiskAssessment}
                      label="Оценка рисков"
                    />
                    <p className="mt-1 ml-[3.375rem] text-xs text-gray-500">
                      Автоматическая оценка рисков через LLM
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={settingsDeduplication}
                        onChange={setSettingsDeduplication}
                        label="Дедупликация"
                      />
                      {settingsDeduplication && (
                        <Select
                          options={DEDUP_STRATEGY_OPTIONS}
                          value={settingsDedupStrategy}
                          onChange={setSettingsDedupStrategy}
                          className="w-48"
                        />
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={settingsNotifications}
                    onChange={setSettingsNotifications}
                    label="Уведомлять о новых инициативах высокого риска"
                  />
                  <Switch
                    checked={settingsEnabled}
                    onChange={setSettingsEnabled}
                    label="Включён"
                  />
                </div>
              </section>
            </CardContent>
          </Card>

          {/* Settings actions */}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Удалить парсер
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleTestRun}>
                <Play className="h-4 w-4" />
                Тестовый запуск
              </Button>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление парсера"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">
              Вы уверены, что хотите удалить парсер &quot;{parser.name}&quot;? Это действие необратимо.
              Все связанные логи и данные будут удалены.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
