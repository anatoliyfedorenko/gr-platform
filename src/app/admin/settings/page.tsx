'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Send,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
];

const CURRENCY_OPTIONS = [
  { value: 'KGS', label: 'KGS (сом)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
];

const LLM_PROVIDER_OPTIONS = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom Endpoint' },
];

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'mistral-large', label: 'Mistral Large' },
  { value: 'mistral-medium', label: 'Mistral Medium' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
  { value: 'deepseek-r1', label: 'DeepSeek R1' },
];

const EMBEDDING_MODEL_OPTIONS = [
  { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
  { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
  { value: 'voyage-3-large', label: 'voyage-3-large' },
  { value: 'voyage-3-lite', label: 'voyage-3-lite' },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
];

const DEFAULT_SYSTEM_PROMPT = `Вы — ассистент GR Intelligence Platform, специализирующийся на анализе государственного регулирования (GR) в Кыргызской Республике, с фокусом на IT-сектор и Парк высоких технологий (ПВТ).

Ваши задачи:
1. Анализ законодательных инициатив и нормативных актов КР
2. Оценка рисков для IT-бизнеса и резидентов ПВТ
3. Подготовка аналитических справок и рекомендаций
4. Мониторинг изменений в регуляторной среде (Закон о ПВТ, Цифровой кодекс, защита данных)

При ответе:
- Используйте официальный деловой стиль
- Ссылайтесь на конкретные нормативные акты КР
- Давайте практические рекомендации
- Оценивайте потенциальные риски по шкале: низкий / средний / высокий`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const storeState = useStore() as any;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // ---- General settings ----
  const systemSettings = storeState.systemSettings || {};
  const [platformName, setPlatformName] = useState(systemSettings.platformName || 'GR Intelligence Platform');
  const [language, setLanguage] = useState(systemSettings.language || 'ru');
  const [dateFormat, setDateFormat] = useState(systemSettings.dateFormat || 'DD.MM.YYYY');
  const [currency, setCurrency] = useState(systemSettings.currency || 'KGS');
  const [sessionTimeout, setSessionTimeout] = useState(systemSettings.sessionTimeout?.toString() || '30');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(systemSettings.maxLoginAttempts?.toString() || '5');
  const [maintenanceMode, setMaintenanceMode] = useState(systemSettings.maintenanceMode || false);
  const [defaultTopics, setDefaultTopics] = useState(systemSettings.defaultTopics || 'Регулирование ПВТ, Цифровой кодекс, Защита данных, Кибербезопасность');
  const [defaultRegions, setDefaultRegions] = useState(systemSettings.defaultRegions || 'Республиканский, Бишкек, Ошская область');
  const [defaultSources, setDefaultSources] = useState(systemSettings.defaultSources || 'Жогорку Кенеш, Минцифры КР, Кабинет Министров КР');

  // ---- LLM Configuration ----
  const llmConfig = storeState.llmConfig || {};
  const [llmProvider, setLlmProvider] = useState(llmConfig.provider || 'openrouter');
  const [llmApiKey, setLlmApiKey] = useState(llmConfig.apiKey || '');
  const [primaryModel, setPrimaryModel] = useState(llmConfig.primaryModel || 'claude-sonnet-4-5');
  const [fastModel, setFastModel] = useState(llmConfig.fastModel || 'claude-haiku-4-5');
  const [embeddingModel, setEmbeddingModel] = useState(llmConfig.embeddingModel || 'text-embedding-3-large');
  const [systemPrompt, setSystemPrompt] = useState(llmConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(llmConfig.temperature?.toString() || '0.3');
  const [maxOutputTokens, setMaxOutputTokens] = useState(llmConfig.maxOutputTokens?.toString() || '4096');
  const [rateLimitUser, setRateLimitUser] = useState(llmConfig.rateLimitUser?.toString() || '20');
  const [rateLimitGlobal, setRateLimitGlobal] = useState(llmConfig.rateLimitGlobal?.toString() || '200');
  const [costAlertThreshold, setCostAlertThreshold] = useState(llmConfig.costAlertThreshold?.toString() || '100');

  // ---- Notifications ----
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@grplatform.ru');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromAddress, setFromAddress] = useState('noreply@grplatform.ru');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramWebhookUrl] = useState('https://api.grplatform.ru/webhooks/telegram');
  const [notifyNewInitiative, setNotifyNewInitiative] = useState(true);
  const [notifyRiskChange, setNotifyRiskChange] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifyParserFailure, setNotifyParserFailure] = useState(true);
  const [notifyNewTicket, setNotifyNewTicket] = useState(false);
  const [notifyTicketResolved, setNotifyTicketResolved] = useState(false);

  // ---- Export ----
  const [exportWatermark, setExportWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('GR Intelligence Platform — Конфиденциально');
  const [defaultExportFormat, setDefaultExportFormat] = useState('pdf');
  const [maxUploadSize, setMaxUploadSize] = useState('50');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleSaveGeneral = () => {
    toast.success('Общие настройки сохранены');
  };

  const handleSaveLLM = () => {
    toast.success('Настройки LLM сохранены');
  };

  const handleTestConnection = () => {
    toast.success('Соединение с LLM успешно установлено');
  };

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast.success('Системный промпт сброшен к значению по умолчанию');
  };

  const handleSaveNotifications = () => {
    toast.success('Настройки уведомлений сохранены');
  };

  const handleSendTestEmail = () => {
    toast.success('Тестовое письмо отправлено');
  };

  const handleSendTestTelegram = () => {
    toast.success('Тестовое сообщение отправлено в Telegram');
  };

  const handleSaveExport = () => {
    toast.success('Настройки экспорта сохранены');
  };

  // Storage usage mock
  const storageUsedGB = 2.4;
  const storageTotalGB = 10;
  const storagePercent = Math.round((storageUsedGB / storageTotalGB) * 100);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Настройки' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Настройки системы</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="llm">LLM конфигурация</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>

        {/* ====== General Tab ====== */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основные параметры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Название платформы</label>
                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Язык</label>
                    <Select options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Формат даты</label>
                    <Select options={DATE_FORMAT_OPTIONS} value={dateFormat} onChange={setDateFormat} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Валюта</label>
                    <Select options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Тайм-аут сессии (мин)</label>
                    <Input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Макс. попыток входа</label>
                    <Input
                      type="number"
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={maintenanceMode}
                        onChange={setMaintenanceMode}
                        label="Режим обслуживания"
                      />
                    </div>
                    {maintenanceMode && (
                      <p className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                        Внимание: В режиме обслуживания платформа будет недоступна для пользователей.
                        Только администраторы смогут войти в систему.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Настройки мониторинга по умолчанию</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Тематики по умолчанию (через запятую)</label>
                    <Input value={defaultTopics} onChange={(e) => setDefaultTopics(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Регионы по умолчанию (через запятую)</label>
                    <Input value={defaultRegions} onChange={(e) => setDefaultRegions(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Источники по умолчанию (через запятую)</label>
                    <Input value={defaultSources} onChange={(e) => setDefaultSources(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ====== LLM Configuration Tab ====== */}
        <TabsContent value="llm">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Провайдер и подключение</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Провайдер</label>
                    <Select options={LLM_PROVIDER_OPTIONS} value={llmProvider} onChange={setLlmProvider} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">API ключ</label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={llmApiKey}
                        onChange={(e) => setLlmApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="flex-1"
                      />
                      <Button variant="outline" size="default" onClick={handleTestConnection}>
                        Тест
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Модели</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Основная модель</label>
                    <Select options={MODEL_OPTIONS} value={primaryModel} onChange={setPrimaryModel} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Быстрая модель</label>
                    <Select options={MODEL_OPTIONS} value={fastModel} onChange={setFastModel} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Модель эмбеддингов</label>
                    <Select options={EMBEDDING_MODEL_OPTIONS} value={embeddingModel} onChange={setEmbeddingModel} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Системный промпт</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleResetPrompt}>
                    <RotateCcw className="h-4 w-4" />
                    Сбросить
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-400 text-right">
                  {systemPrompt.length} символов
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Параметры и лимиты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Temperature</label>
                    <Input
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      step={0.1}
                      min={0}
                      max={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Макс. токенов на выход</label>
                    <Input
                      type="number"
                      value={maxOutputTokens}
                      onChange={(e) => setMaxOutputTokens(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Лимит запросов/мин (пользователь)</label>
                    <Input
                      type="number"
                      value={rateLimitUser}
                      onChange={(e) => setRateLimitUser(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Лимит запросов/мин (глобальный)</label>
                    <Input
                      type="number"
                      value={rateLimitGlobal}
                      onChange={(e) => setRateLimitGlobal(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Порог оповещения о затратах (USD)</label>
                    <Input
                      type="number"
                      value={costAlertThreshold}
                      onChange={(e) => setCostAlertThreshold(e.target.value)}
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveLLM}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ====== Notifications Tab ====== */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            {/* Email Provider */}
            <Card>
              <CardHeader>
                <CardTitle>Email провайдер (SMTP)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">SMTP хост</label>
                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Порт</label>
                    <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Пользователь</label>
                    <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Пароль</label>
                    <Input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="SMTP пароль"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Адрес отправителя</label>
                    <Input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleSendTestEmail}>
                    <Send className="h-4 w-4" />
                    Отправить тестовое письмо
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Telegram */}
            <Card>
              <CardHeader>
                <CardTitle>Telegram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Bot Token</label>
                    <Input
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="123456:ABC-DEF..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Webhook URL</label>
                    <Input value={telegramWebhookUrl} disabled className="bg-gray-50" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleSendTestTelegram}>
                    <MessageSquare className="h-4 w-4" />
                    Отправить тестовое сообщение
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Правила уведомлений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Новая инициатива</p>
                      <p className="text-xs text-gray-500">Уведомлять при появлении новой законодательной инициативы</p>
                    </div>
                    <Switch checked={notifyNewInitiative} onChange={setNotifyNewInitiative} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Изменение уровня риска</p>
                      <p className="text-xs text-gray-500">Уведомлять при изменении оценки риска инициативы</p>
                    </div>
                    <Switch checked={notifyRiskChange} onChange={setNotifyRiskChange} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Приближение дедлайна</p>
                      <p className="text-xs text-gray-500">Уведомлять за 3 дня до дедлайна по задаче</p>
                    </div>
                    <Switch checked={notifyDeadline} onChange={setNotifyDeadline} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Сбой парсера</p>
                      <p className="text-xs text-gray-500">Уведомлять при ошибке в работе парсера данных</p>
                    </div>
                    <Switch checked={notifyParserFailure} onChange={setNotifyParserFailure} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Новый тикет</p>
                      <p className="text-xs text-gray-500">Уведомлять при создании нового тикета</p>
                    </div>
                    <Switch checked={notifyNewTicket} onChange={setNotifyNewTicket} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Тикет решён</p>
                      <p className="text-xs text-gray-500">Уведомлять при закрытии тикета</p>
                    </div>
                    <Switch checked={notifyTicketResolved} onChange={setNotifyTicketResolved} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ====== Export Tab ====== */}
        <TabsContent value="export">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки экспорта</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={exportWatermark}
                        onChange={setExportWatermark}
                        label="Водяной знак при экспорте"
                      />
                    </div>
                    {exportWatermark && (
                      <div className="mt-3 ml-[3.375rem]">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Текст водяного знака</label>
                        <Input
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="max-w-md"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Формат экспорта по умолчанию</label>
                    <Select
                      options={EXPORT_FORMAT_OPTIONS}
                      value={defaultExportFormat}
                      onChange={setDefaultExportFormat}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Хранилище</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Использовано</span>
                      <span className="text-sm text-gray-500">
                        {storageUsedGB} ГБ / {storageTotalGB} ГБ
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{storagePercent}% использовано</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Макс. размер загрузки (МБ)</label>
                    <Input
                      type="number"
                      value={maxUploadSize}
                      onChange={(e) => setMaxUploadSize(e.target.value)}
                      min={1}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveExport}>
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
