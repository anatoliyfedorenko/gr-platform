'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Shield,
  Mail,
  Bell,
  Smartphone,
  Monitor,
  RefreshCw,
  Building2,
  Link2,
  Save,
  Trash2,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { ROLE_PERMISSIONS, ROLE_LABELS } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

import companiesData from '@/data/companies.json';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_TOPICS = [
  'Регулирование ПВТ',
  'Цифровой кодекс',
  'Защита данных',
  'Налоговые преференции',
  'Кибербезопасность',
  'Электронная коммерция',
  'Телекоммуникации',
  'Лицензирование ПО',
  'Экспорт IT-услуг',
  'Электронное правительство',
  'Стартап-экосистема',
  'Цифровизация',
];

const ALL_REGIONS = [
  'Республиканский',
  'Бишкек',
  'Чуйская область',
  'Ошская область',
  'Джалал-Абадская область',
  'Иссык-Кульская область',
  'Нарынская область',
  'Баткенская область',
];

const SETTINGS_STORAGE_KEY = 'gr-platform-page-settings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageSettings {
  topics: string[];
  keywords: string[];
  regions: string[];
  emailNotifications: boolean;
  inAppNotifications: boolean;
  weeklyDigest: boolean;
  integrations: {
    consultantPlus: boolean;
    garant: boolean;
    emailNewsletter: boolean;
    emailAddress: string;
  };
}

const defaultPageSettings: PageSettings = {
  topics: ['Регулирование ПВТ', 'Цифровой кодекс', 'Защита данных', 'Кибербезопасность'],
  keywords: ['ПВТ', 'IT', 'регулирование', 'цифровой кодекс'],
  regions: ['Республиканский', 'Бишкек'],
  emailNotifications: true,
  inAppNotifications: true,
  weeklyDigest: false,
  integrations: {
    consultantPlus: true,
    garant: false,
    emailNewsletter: false,
    emailAddress: '',
  },
};

function loadPageSettings(): PageSettings {
  if (typeof window === 'undefined') return defaultPageSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return defaultPageSettings;
}

function savePageSettings(settings: PageSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    currentRole,
    currentCompanyId,
    settings: storeSettings,
    updateSettings,
    resetDemoData,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring');
  const [pageSettings, setPageSettings] = useState<PageSettings>(defaultPageSettings);
  const [keywordInput, setKeywordInput] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : null;
  const canEdit = permissions?.canEditSettings ?? false;

  // Load settings from localStorage on mount
  useEffect(() => {
    setPageSettings(loadPageSettings());
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Find current company
  const currentCompany = useMemo(() => {
    if (!currentCompanyId) return null;
    return companiesData.find((c) => c.id === currentCompanyId) || null;
  }, [currentCompanyId]);

  // ---- Handlers ----

  const handleTopicToggle = useCallback(
    (topic: string) => {
      if (!canEdit) return;
      setPageSettings((prev) => {
        const has = prev.topics.includes(topic);
        return {
          ...prev,
          topics: has
            ? prev.topics.filter((t) => t !== topic)
            : [...prev.topics, topic],
        };
      });
    },
    [canEdit]
  );

  const handleRegionToggle = useCallback(
    (region: string) => {
      if (!canEdit) return;
      setPageSettings((prev) => {
        const has = prev.regions.includes(region);
        return {
          ...prev,
          regions: has
            ? prev.regions.filter((r) => r !== region)
            : [...prev.regions, region],
        };
      });
    },
    [canEdit]
  );

  const handleAddKeyword = useCallback(() => {
    if (!canEdit) return;
    const trimmed = keywordInput.trim();
    if (!trimmed) return;

    // Support comma-separated input
    const newKeywords = trimmed
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    setPageSettings((prev) => ({
      ...prev,
      keywords: [
        ...prev.keywords,
        ...newKeywords.filter((k) => !prev.keywords.includes(k)),
      ],
    }));
    setKeywordInput('');
  }, [canEdit, keywordInput]);

  const handleRemoveKeyword = useCallback(
    (keyword: string) => {
      if (!canEdit) return;
      setPageSettings((prev) => ({
        ...prev,
        keywords: prev.keywords.filter((k) => k !== keyword),
      }));
    },
    [canEdit]
  );

  const handleKeywordKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddKeyword();
      }
    },
    [handleAddKeyword]
  );

  const handleSaveMonitoring = useCallback(() => {
    savePageSettings(pageSettings);
    // Also sync with zustand store
    updateSettings({
      topics: pageSettings.topics,
      regions: pageSettings.regions,
      emailNotifications: pageSettings.emailNotifications,
    });
    toast.success('Настройки сохранены');
  }, [pageSettings, updateSettings]);

  const handleSaveIntegrations = useCallback(() => {
    savePageSettings(pageSettings);
    toast.success('Настройки интеграций сохранены');
  }, [pageSettings]);

  const handleResetDemo = useCallback(() => {
    resetDemoData();
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setResetModalOpen(false);
    toast.success('Демо-данные сброшены');
    // Reload the page to reset all state
    window.location.reload();
  }, [resetDemoData]);

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-96" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        {!canEdit && (
          <Badge variant="yellow">Только просмотр</Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monitoring">
            Профиль мониторинга
          </TabsTrigger>
          <TabsTrigger value="company">
            Профиль компании
          </TabsTrigger>
          <TabsTrigger value="integrations">
            Интеграции
          </TabsTrigger>
        </TabsList>

        {/* ====== Tab: Monitoring Profile ====== */}
        <TabsContent value="monitoring">
          <div className="space-y-6">
            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Тематики мониторинга</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {ALL_TOPICS.map((topic) => (
                    <Switch
                      key={topic}
                      checked={pageSettings.topics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      label={topic}
                      disabled={!canEdit}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Ключевые слова</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите ключевые слова через запятую..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      disabled={!canEdit}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleAddKeyword}
                      disabled={!canEdit || !keywordInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить
                    </Button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {pageSettings.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700"
                      >
                        {keyword}
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
                            aria-label={`Удалить "${keyword}"`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {pageSettings.keywords.length === 0 && (
                      <p className="text-sm text-gray-400">
                        Ключевые слова не добавлены
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regions */}
            <Card>
              <CardHeader>
                <CardTitle>Регионы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {ALL_REGIONS.map((region) => (
                    <Switch
                      key={region}
                      checked={pageSettings.regions.includes(region)}
                      onChange={() => handleRegionToggle(region)}
                      label={region}
                      disabled={!canEdit}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification channels */}
            <Card>
              <CardHeader>
                <CardTitle>Каналы уведомлений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Email уведомления
                        </p>
                        <p className="text-xs text-gray-500">
                          Получать уведомления на email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pageSettings.emailNotifications}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          In-app уведомления
                        </p>
                        <p className="text-xs text-gray-500">
                          Уведомления внутри платформы
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pageSettings.inAppNotifications}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          inAppNotifications: checked,
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <Monitor className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Еженедельный дайджест
                        </p>
                        <p className="text-xs text-gray-500">
                          Сводка событий раз в неделю
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pageSettings.weeklyDigest}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          weeklyDigest: checked,
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={handleSaveMonitoring}>
                  <Save className="h-4 w-4" />
                  Сохранить настройки
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ====== Tab: Company Profile ====== */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                Профиль компании
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCompany ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Название
                      </label>
                      <Input
                        value={currentCompany.name}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        ИНН
                      </label>
                      <Input
                        value={currentCompany.inn}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Отрасль
                      </label>
                      <Input
                        value={currentCompany.industry}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Регион
                      </label>
                      <Input
                        value={currentCompany.region}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Сотрудников
                      </label>
                      <Input
                        value={currentCompany.employees.toLocaleString('ru-RU')}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-lg font-medium text-gray-500">
                    Компания не выбрана
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {currentRole === 'consultant'
                      ? 'Выберите рабочее пространство для просмотра профиля компании'
                      : 'Информация о компании недоступна'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== Tab: Integrations ====== */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* КонсультантПлюс */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Токтом
                      </p>
                      <p className="text-xs text-gray-500">
                        Правовая база данных КР
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        pageSettings.integrations.consultantPlus
                          ? 'green'
                          : 'default'
                      }
                    >
                      {pageSettings.integrations.consultantPlus
                        ? 'Подключено'
                        : 'Отключено'}
                    </Badge>
                    <Switch
                      checked={pageSettings.integrations.consultantPlus}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            consultantPlus: checked,
                          },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Гарант */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        ЦБД Минюста КР
                      </p>
                      <p className="text-xs text-gray-500">
                        Централизованный банк данных правовой информации
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        pageSettings.integrations.garant ? 'green' : 'default'
                      }
                    >
                      {pageSettings.integrations.garant
                        ? 'Подключено'
                        : 'Отключено'}
                    </Badge>
                    <Switch
                      checked={pageSettings.integrations.garant}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            garant: checked,
                          },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email рассылка */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Email рассылка
                      </p>
                      <p className="text-xs text-gray-500">
                        Автоматическая отправка отчётов
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        pageSettings.integrations.emailNewsletter
                          ? 'green'
                          : 'default'
                      }
                    >
                      {pageSettings.integrations.emailNewsletter
                        ? 'Подключено'
                        : 'Отключено'}
                    </Badge>
                    <Switch
                      checked={pageSettings.integrations.emailNewsletter}
                      onChange={(checked) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            emailNewsletter: checked,
                          },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {/* Email field */}
                {pageSettings.integrations.emailNewsletter && (
                  <div className="mt-4 pl-16">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Email для рассылки
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={pageSettings.integrations.emailAddress}
                      onChange={(e) =>
                        setPageSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            emailAddress: e.target.value,
                          },
                        }))
                      }
                      disabled={!canEdit}
                      className="max-w-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save */}
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={handleSaveIntegrations}>
                  <Save className="h-4 w-4" />
                  Сохранить настройки
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reset demo data (always visible at bottom) */}
      <div className="border-t border-gray-200 pt-6">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-900">
                  Сброс демо-данных
                </h3>
                <p className="mt-1 text-xs text-red-700">
                  Все изменения будут потеряны. Данные вернутся к начальному
                  состоянию.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setResetModalOpen(true)}
              >
                <RefreshCw className="h-4 w-4" />
                Сброс демо-данных
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Подтверждение сброса"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Вы уверены? Все изменения будут потеряны. Данные инициатив,
              документов, уведомлений и настроек вернутся к начальному
              демо-состоянию.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetDemo}
            >
              <Trash2 className="h-4 w-4" />
              Сбросить данные
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
