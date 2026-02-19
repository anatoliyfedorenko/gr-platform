'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// ---------------------------------------------------------------------------
// Options
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
// Component
// ---------------------------------------------------------------------------

export default function AdminParsersNewPage() {
  const router = useRouter();

  // Basic info
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('rss');
  const [sourceUrl, setSourceUrl] = useState('');

  // Schedule
  const [schedule, setSchedule] = useState('0 * * * *');
  const [customCron, setCustomCron] = useState('');

  // Auth
  const [authType, setAuthType] = useState('none');
  const [credentials, setCredentials] = useState('');

  // Data mapping
  const [titleSelector, setTitleSelector] = useState('');
  const [summarySelector, setSummarySelector] = useState('');
  const [dateSelector, setDateSelector] = useState('');
  const [topicClassification, setTopicClassification] = useState('keywords');

  // Options
  const [riskAssessment, setRiskAssessment] = useState(false);
  const [deduplication, setDeduplication] = useState(true);
  const [dedupStrategy, setDedupStrategy] = useState('title');
  const [notifications, setNotifications] = useState(true);
  const [enabled, setEnabled] = useState(true);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Укажите название парсера');
      return;
    }
    if (!sourceUrl.trim()) {
      toast.error('Укажите URL источника');
      return;
    }
    toast.success(`Парсер "${name}" успешно создан`);
    router.push('/admin/parsers');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Парсеры', href: '/admin/parsers' },
          { label: 'Добавить' },
        ]}
      />

      <h1 className="text-2xl font-bold text-gray-900">Добавить парсер</h1>

      <Card>
        <CardContent className="p-6 space-y-8">
          {/* Basic Info */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Основная информация</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Название парсера <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Госдума RSS"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Тип источника</label>
                <Select
                  options={SOURCE_TYPE_OPTIONS}
                  value={sourceType}
                  onChange={setSourceType}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  URL источника <span className="text-red-500">*</span>
                </label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/rss"
                />
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
                  value={schedule}
                  onChange={setSchedule}
                />
              </div>
              {schedule === 'custom' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Cron выражение</label>
                  <Input
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
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
                  value={authType}
                  onChange={setAuthType}
                />
              </div>
              {authType !== 'none' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Учётные данные</label>
                  <Input
                    type="password"
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
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
                  value={titleSelector}
                  onChange={(e) => setTitleSelector(e.target.value)}
                  placeholder="CSS selector or JSON path"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Селектор описания</label>
                <Input
                  value={summarySelector}
                  onChange={(e) => setSummarySelector(e.target.value)}
                  placeholder="CSS selector or JSON path"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Селектор даты</label>
                <Input
                  value={dateSelector}
                  onChange={(e) => setDateSelector(e.target.value)}
                  placeholder="CSS selector or JSON path"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Классификация тем</label>
                <Select
                  options={TOPIC_CLASSIFICATION_OPTIONS}
                  value={topicClassification}
                  onChange={setTopicClassification}
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
                  checked={riskAssessment}
                  onChange={setRiskAssessment}
                  label="Оценка рисков"
                />
                <p className="mt-1 ml-[3.375rem] text-xs text-gray-500">
                  Автоматическая оценка рисков через LLM
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={deduplication}
                    onChange={setDeduplication}
                    label="Дедупликация"
                  />
                  {deduplication && (
                    <Select
                      options={DEDUP_STRATEGY_OPTIONS}
                      value={dedupStrategy}
                      onChange={setDedupStrategy}
                      className="w-48"
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-gray-700">Целевые компании:</span>
                  <span className="text-sm text-gray-500">Все компании</span>
                </div>
              </div>

              <div>
                <Switch
                  checked={notifications}
                  onChange={setNotifications}
                  label="Уведомления"
                />
                <p className="mt-1 ml-[3.375rem] text-xs text-gray-500">
                  Уведомлять о новых инициативах высокого риска
                </p>
              </div>

              <div>
                <Switch
                  checked={enabled}
                  onChange={setEnabled}
                  label="Включён"
                />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/admin/parsers')}>
          <X className="h-4 w-4" />
          Отмена
        </Button>
        <Button onClick={handleCreate}>
          <Save className="h-4 w-4" />
          Создать
        </Button>
      </div>
    </div>
  );
}
