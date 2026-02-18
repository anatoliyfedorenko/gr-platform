'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  FileDown,
  Presentation,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { cn, formatCurrency } from '@/lib/utils';
import { ROLE_PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateWizard } from '@/components/templates/TemplateWizard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const STATUS_COLORS: Record<string, string> = {
  'На рассмотрении': '#F59E0B',
  'В разработке': '#3B82F6',
  'Принято': '#10B981',
  'Отклонено': '#EF4444',
};

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function generatePeriodOptions(type: 'month' | 'quarter') {
  const options: { value: string; label: string }[] = [];
  if (type === 'month') {
    // Last 6 months from February 2026
    const monthList = [
      { month: 1, year: 2026 },
      { month: 0, year: 2026 },
      { month: 11, year: 2025 },
      { month: 10, year: 2025 },
      { month: 9, year: 2025 },
      { month: 8, year: 2025 },
    ];
    for (const { month, year } of monthList) {
      const val = `${year}-${String(month + 1).padStart(2, '0')}`;
      options.push({ value: val, label: `${MONTHS[month]} ${year}` });
    }
  } else {
    options.push(
      { value: '2026-Q1', label: 'Q1 2026' },
      { value: '2025-Q4', label: 'Q4 2025' },
      { value: '2025-Q3', label: 'Q3 2025' },
      { value: '2025-Q2', label: 'Q2 2025' }
    );
  }
  return options;
}

// Mock economic effect trend data
const economicTrendData = [
  { month: 'Сен', value: 12000000 },
  { month: 'Окт', value: 18000000 },
  { month: 'Ноя', value: 25000000 },
  { month: 'Дек', value: 32000000 },
  { month: 'Янв', value: 38000000 },
  { month: 'Фев', value: 45000000 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const router = useRouter();
  const {
    initiatives,
    documents,
    stakeholders,
    currentRole,
    currentCompanyId,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'month' | 'quarter'>('month');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-02');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'pptx'>('pdf');
  const [reportWizardOpen, setReportWizardOpen] = useState(false);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [selectedPeriod, periodType]);

  // Update period when type changes
  useEffect(() => {
    const opts = generatePeriodOptions(periodType);
    if (opts.length > 0) {
      setSelectedPeriod(opts[0].value);
    }
  }, [periodType]);

  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : null;

  // ------ Computed data ------

  const totalInteractions = useMemo(() => {
    return stakeholders.reduce(
      (sum, s) => sum + (s.interactions ? s.interactions.length : 0),
      0
    );
  }, [stakeholders]);

  const averageRisk = useMemo(() => {
    if (initiatives.length === 0) return 'Н/Д';
    const riskMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const avg =
      initiatives.reduce((sum, i) => sum + (riskMap[i.risk] || 2), 0) /
      initiatives.length;
    if (avg >= 2.5) return 'Высокий';
    if (avg >= 1.5) return 'Средний';
    return 'Низкий';
  }, [initiatives]);

  const topRisks = useMemo(() => {
    return [...initiatives]
      .filter((i) => i.risk === 'high')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }, [initiatives]);

  // Bar chart: initiatives by topic
  const topicChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of initiatives) {
      counts[i.topic] = (counts[i.topic] || 0) + 1;
    }
    return Object.entries(counts).map(([topic, count]) => ({
      topic,
      count,
    }));
  }, [initiatives]);

  // Pie chart: initiatives by status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of initiatives) {
      counts[i.status] = (counts[i.status] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [initiatives]);

  // Actions by type (mock bar chart data)
  const actionsData = useMemo(() => {
    const docDrafts = documents.filter((d) => d.status === 'draft').length;
    const docApproved = documents.filter((d) => d.status === 'approved').length;
    const docReview = documents.filter(
      (d) => d.status === 'in_review'
    ).length;
    const docSent = documents.filter((d) => d.status === 'sent').length;
    return [
      { name: 'Черновики', value: docDrafts },
      { name: 'На проверке', value: docReview },
      { name: 'Утверждены', value: docApproved },
      { name: 'Отправлены', value: docSent },
    ];
  }, [documents]);

  // Export helpers
  const getExportFilename = useCallback(() => {
    const ext = exportFormat === 'pdf' ? 'pdf' : 'pptx';
    const periodStr = selectedPeriod.replace('-', '_');
    return `report_${periodStr}.${ext}`;
  }, [exportFormat, selectedPeriod]);

  const handleExport = useCallback(
    (format: 'pdf' | 'pptx') => {
      setExportFormat(format);
      setExportModalOpen(true);
    },
    []
  );

  const handleDownload = useCallback(() => {
    const filename = getExportFilename();
    const content = `GR Intelligence Platform - Report\nPeriod: ${selectedPeriod}\nGenerated: ${new Date().toISOString()}\n\nTotal Initiatives: ${initiatives.length}\nDocuments: ${documents.length}\nInteractions: ${totalInteractions}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportModalOpen(false);
    toast.success(`Отчёт "${filename}" экспортирован`);
  }, [
    getExportFilename,
    selectedPeriod,
    initiatives.length,
    documents.length,
    totalInteractions,
  ]);

  const periodOptions = useMemo(
    () => generatePeriodOptions(periodType),
    [periodType]
  );

  // ------ Loading state ------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  // ------ Main render ------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Отчёты</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period type toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                periodType === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              onClick={() => setPeriodType('month')}
            >
              Месяц
            </button>
            <button
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                periodType === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              onClick={() => setPeriodType('quarter')}
            >
              Квартал
            </button>
          </div>

          {/* Period selector */}
          <Select
            options={periodOptions}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            className="w-44"
          />

          {/* Generate report button */}
          {permissions?.canCreate && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setReportWizardOpen(true)}
            >
              <FileText className="h-4 w-4" />
              Сгенерировать отчёт
            </Button>
          )}

          {/* Export buttons */}
          {permissions?.canExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
              >
                <FileDown className="h-4 w-4" />
                Экспорт PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pptx')}
              >
                <Presentation className="h-4 w-4" />
                Экспорт PPTX
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Section 1: KPI Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Ключевые показатели
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Всего инициатив"
            value={initiatives.length}
            change="+2 за период"
            trend="up"
            icon={<FileText className="h-5 w-5" />}
          />
          <KPICard
            title="Новых за период"
            value={8}
            change="+3 к пред. периоду"
            trend="up"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            title="Документов создано"
            value={documents.length}
            change="+1 за период"
            trend="up"
            icon={<FileText className="h-5 w-5" />}
          />
          <KPICard
            title="Взаимодействий"
            value={totalInteractions}
            change="+4 за период"
            trend="up"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <KPICard
            title="Средний риск"
            value={averageRisk}
            change="Стабильно"
            trend="neutral"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Section 2: Top risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Топ риски
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRisks.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Нет инициатив с высоким риском
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topRisks.map((ini, index) => (
                <div
                  key={ini.id}
                  className="flex items-center gap-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 -mx-6 px-6"
                  onClick={() => router.push(`/app/initiatives/${ini.id}`)}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {ini.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ini.status} &middot; Релевантность: {ini.relevanceScore}%
                    </p>
                  </div>
                  <Badge variant="red">Высокий</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3 & 4: Actions + Economic effect */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 3: Actions taken */}
        <Card>
          <CardHeader>
            <CardTitle>Предпринятые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {documents.length}
                </p>
                <p className="text-xs text-blue-600">Документов создано</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {totalInteractions}
                </p>
                <p className="text-xs text-green-600">Взаимодействий</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {initiatives.length}
                </p>
                <p className="text-xs text-purple-600">На мониторинге</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Количество"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Economic effect */}
        <Card>
          <CardHeader>
            <CardTitle>Экономический эффект</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                <div>
                  <p className="text-xs text-green-600">
                    Оценка предотвращённого ущерба
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(45000000)}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div>
                  <p className="text-xs text-blue-600">
                    Оценка сэкономленных ресурсов
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatCurrency(12500000)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={economicTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    tickFormatter={(v) =>
                      `${(v / 1000000).toFixed(0)}M`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                    formatter={(value: number | undefined) => [
                      formatCurrency(value ?? 0),
                      'Эффект',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Эффект"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart: Initiatives by topic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Инициативы по тематике
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicChartData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    tick={{ fontSize: 11 }}
                    stroke="#9CA3AF"
                    width={180}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    name="Количество"
                  >
                    {topicChartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart: Initiatives by status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              Инициативы по статусу
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({
                      name,
                      percent,
                    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    any) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          STATUS_COLORS[entry.name] ||
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Wizard for GR Report */}
      <TemplateWizard
        open={reportWizardOpen}
        onClose={() => setReportWizardOpen(false)}
        preselectedTemplate="gr_report"
        entryPoint="report"
      />

      {/* Export Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Отчёт успешно экспортирован"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {exportFormat === 'pdf' ? (
              <FileDown className="h-8 w-8 text-red-500" />
            ) : (
              <Presentation className="h-8 w-8 text-orange-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getExportFilename()}
              </p>
              <p className="text-xs text-gray-500">
                {exportFormat === 'pdf' ? 'PDF документ' : 'Презентация PPTX'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(false)}
            >
              Закрыть
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Скачать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
