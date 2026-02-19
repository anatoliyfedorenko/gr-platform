'use client';

import { useMemo } from 'react';
import {
  Building2,
  Users,
  FileText,
  FolderOpen,
  Database,
  MessageSquare,
  Brain,
  UserPlus,
  Briefcase,
  FileDown,
  AlertTriangle,
  Settings,
  TicketCheck,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useStore } from '@/store/useStore';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const PIE_DATA = [
  { name: 'Аналитическая записка', value: 12 },
  { name: 'Предложение поправок', value: 8 },
  { name: 'Официальное письмо', value: 15 },
  { name: 'Отчёт GR', value: 6 },
  { name: 'Презентация', value: 4 },
];

interface ActivityItem {
  id: number;
  type: string;
  badgeVariant: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'default';
  icon: React.ElementType;
  description: string;
  timestamp: string;
}

const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, type: 'user_registered', badgeVariant: 'blue', icon: UserPlus, description: 'Новый пользователь зарегистрирован: Иванов А.С. (ООО "ТелекомПро")', timestamp: '2026-02-19 14:32' },
  { id: 2, type: 'company_onboarded', badgeVariant: 'green', icon: Briefcase, description: 'Компания "МедиаГрупп" завершила онбординг', timestamp: '2026-02-19 13:15' },
  { id: 3, type: 'document_generated', badgeVariant: 'purple', icon: FileDown, description: 'Сгенерирован документ: Аналитическая записка по регулированию OTT', timestamp: '2026-02-19 12:45' },
  { id: 4, type: 'parser_error', badgeVariant: 'red', icon: AlertTriangle, description: 'Ошибка парсера: ФАС России — таймаут подключения', timestamp: '2026-02-19 11:20' },
  { id: 5, type: 'settings_changed', badgeVariant: 'yellow', icon: Settings, description: 'Администратор изменил глобальные настройки мониторинга', timestamp: '2026-02-19 10:55' },
  { id: 6, type: 'ticket_submitted', badgeVariant: 'orange', icon: MessageSquare, description: 'Новый тикет поддержки от Петрова М.К.: "Не работает экспорт PDF"', timestamp: '2026-02-19 10:30' },
  { id: 7, type: 'ticket_resolved', badgeVariant: 'green', icon: TicketCheck, description: 'Тикет #42 решён: "Ошибка авторизации при смене роли"', timestamp: '2026-02-19 09:45' },
  { id: 8, type: 'document_generated', badgeVariant: 'purple', icon: FileDown, description: 'Сгенерирован документ: Официальное письмо в Минцифры России', timestamp: '2026-02-18 18:20' },
  { id: 9, type: 'user_registered', badgeVariant: 'blue', icon: UserPlus, description: 'Новый пользователь зарегистрирован: Сидорова Е.В. (ПАО "Связьинвест")', timestamp: '2026-02-18 16:40' },
  { id: 10, type: 'parser_error', badgeVariant: 'red', icon: AlertTriangle, description: 'Ошибка парсера: Роскомнадзор — изменена структура HTML', timestamp: '2026-02-18 15:10' },
  { id: 11, type: 'company_onboarded', badgeVariant: 'green', icon: Briefcase, description: 'Компания "ЦифраТех" завершила онбординг', timestamp: '2026-02-18 14:00' },
  { id: 12, type: 'settings_changed', badgeVariant: 'yellow', icon: Settings, description: 'Изменены настройки LLM: обновлён провайдер по умолчанию', timestamp: '2026-02-18 11:30' },
  { id: 13, type: 'ticket_submitted', badgeVariant: 'orange', icon: MessageSquare, description: 'Новый тикет поддержки от Козлова Д.А.: "Не обновляются инициативы"', timestamp: '2026-02-18 10:15' },
  { id: 14, type: 'document_generated', badgeVariant: 'purple', icon: FileDown, description: 'Сгенерирован документ: Отчёт GR за январь 2026', timestamp: '2026-02-17 17:50' },
  { id: 15, type: 'user_registered', badgeVariant: 'blue', icon: UserPlus, description: 'Новый пользователь зарегистрирован: Морозов К.Л. (ООО "ИнфоСервис")', timestamp: '2026-02-17 14:25' },
];

const ALERTS = [
  { id: 1, severity: 'red' as const, message: 'Парсер "ФАС России" не работает более 2 часов' },
  { id: 2, severity: 'red' as const, message: '3 тикета поддержки без ответа > 24ч' },
  { id: 3, severity: 'yellow' as const, message: 'Использование LLM превысило 80% месячного лимита' },
  { id: 4, severity: 'yellow' as const, message: 'Парсер "Роскомнадзор" — частые ошибки (5 за последние сутки)' },
  { id: 5, severity: 'red' as const, message: 'Компания "ТелекомПро" — истекает срок подписки через 3 дня' },
];

const TYPE_LABELS: Record<string, string> = {
  user_registered: 'Регистрация',
  company_onboarded: 'Онбординг',
  document_generated: 'Документ',
  parser_error: 'Ошибка',
  settings_changed: 'Настройки',
  ticket_submitted: 'Тикет',
  ticket_resolved: 'Решение',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const store = useStore();
  const { companies, initiatives, documents } = store;
  const parsers = (store as any).parsers || [];
  const supportTickets = (store as any).supportTickets || [];
  const llmUsage = (store as any).llmUsage || [];

  const activeParsers = parsers.filter((p: any) => p.status === 'running').length;
  const openTickets = supportTickets.filter(
    (t: any) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  // Risk level bar chart data
  const riskChartData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const ini of initiatives) {
      const risk = ini.risk as 'high' | 'medium' | 'low';
      if (counts[risk] !== undefined) {
        counts[risk]++;
      }
    }
    return [
      { name: 'Высокий', value: counts.high, fill: '#EF4444' },
      { name: 'Средний', value: counts.medium, fill: '#F59E0B' },
      { name: 'Низкий', value: counts.low, fill: '#10B981' },
    ];
  }, [initiatives]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>

      {/* KPI Cards — 7 cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Компании"
          value={companies.length}
          change="Всего"
          trend="neutral"
          icon={<Building2 className="h-5 w-5" />}
        />
        <KPICard
          title="Пользователи"
          value={9}
          change="Всего"
          trend="neutral"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Инициативы"
          value={initiatives.length}
          change="Всего"
          trend="neutral"
          icon={<FileText className="h-5 w-5" />}
        />
        <KPICard
          title="Документы"
          value={documents.length}
          change="Всего"
          trend="neutral"
          icon={<FolderOpen className="h-5 w-5" />}
        />
        <KPICard
          title="Активные парсеры"
          value={activeParsers}
          change={`из ${parsers.length}`}
          trend="neutral"
          icon={<Database className="h-5 w-5" />}
        />
        <KPICard
          title="Открытые тикеты"
          value={openTickets}
          change="Ожидают ответа"
          trend={openTickets > 0 ? 'up' : 'neutral'}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <KPICard
          title="LLM вызовы"
          value={llmUsage?.length || 0}
          change="За этот месяц"
          trend="neutral"
          icon={<Brain className="h-5 w-5" />}
        />
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Лента активности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
            {ACTIVITY_FEED.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">{item.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={item.badgeVariant}>
                        {TYPE_LABELS[item.type] || item.type}
                      </Badge>
                      <span className="text-xs text-gray-400">{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts section: 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart: Documents by Template Type */}
        <Card>
          <CardHeader>
            <CardTitle>Документы по типу шаблона</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    label={({
                      name,
                      percent,
                    }: any) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {PIE_DATA.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
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

        {/* Bar Chart: Initiatives by Risk Level */}
        <Card>
          <CardHeader>
            <CardTitle>Инициативы по уровню риска</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData}>
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
                    radius={[4, 4, 0, 0]}
                    name="Количество"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Оповещения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  alert.severity === 'red'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 flex-shrink-0 ${
                    alert.severity === 'red' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    alert.severity === 'red' ? 'text-red-700' : 'text-yellow-700'
                  }`}
                >
                  {alert.message}
                </p>
                <Badge
                  variant={alert.severity}
                  className="ml-auto flex-shrink-0"
                >
                  {alert.severity === 'red' ? 'Критично' : 'Внимание'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
