'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  Calendar,
  MessageSquare,
  Newspaper,
  Users,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { ROLE_PERMISSIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: 'all', label: 'Все типы' },
  { value: 'initiative_update', label: 'Обновления инициатив' },
  { value: 'deadline', label: 'Дедлайны' },
  { value: 'document_status', label: 'Статус документов' },
  { value: 'interaction', label: 'Взаимодействия' },
  { value: 'media', label: 'Медиа' },
  { value: 'stakeholder_update', label: 'Стейкхолдеры' },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case 'initiative_update':
      return <AlertTriangle className="h-5 w-5" />;
    case 'deadline':
      return <Calendar className="h-5 w-5" />;
    case 'document_status':
      return <FileText className="h-5 w-5" />;
    case 'interaction':
      return <MessageSquare className="h-5 w-5" />;
    case 'media':
      return <Newspaper className="h-5 w-5" />;
    case 'stakeholder_update':
      return <Users className="h-5 w-5" />;
    default:
      return <RefreshCw className="h-5 w-5" />;
  }
}

function getIconContainerClass(type: string) {
  switch (type) {
    case 'initiative_update':
      return 'bg-orange-100 text-orange-600';
    case 'deadline':
      return 'bg-red-100 text-red-600';
    case 'document_status':
      return 'bg-blue-100 text-blue-600';
    case 'interaction':
      return 'bg-green-100 text-green-600';
    case 'media':
      return 'bg-purple-100 text-purple-600';
    case 'stakeholder_update':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getSeverityDotClass(severity: string) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}

function getSeverityBadgeVariant(severity: string): 'red' | 'yellow' | 'green' | 'default' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'default';
  }
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case 'critical':
      return 'Критический';
    case 'high':
      return 'Высокий';
    case 'medium':
      return 'Средний';
    case 'low':
      return 'Низкий';
    default:
      return severity;
  }
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Только что';
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

type DateGroup = 'today' | 'yesterday' | 'this_week' | 'earlier';

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const date = new Date(dateStr);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= todayStart) return 'today';
  if (date >= yesterdayStart) return 'yesterday';
  if (date >= weekStart) return 'this_week';
  return 'earlier';
}

const GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  this_week: 'На этой неделе',
  earlier: 'Ранее',
};

const GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'this_week', 'earlier'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    currentRole,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Permission check
  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : null;

  // Filter notifications
  const filtered = useMemo(() => {
    let items = [...notifications];
    if (filterType !== 'all') {
      items = items.filter((n) => n.type === filterType);
    }
    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Notification[]> = {
      today: [],
      yesterday: [],
      this_week: [],
      earlier: [],
    };
    for (const n of filtered) {
      const group = getDateGroup(n.date);
      groups[group].push(n);
    }
    return groups;
  }, [filtered]);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
    toast.success('Все уведомления отмечены как прочитанные');
  }, [markAllNotificationsRead]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markNotificationRead(id);
      toast.success('Уведомление отмечено как прочитанное');
    },
    [markNotificationRead]
  );

  const handleOpen = useCallback(
    (n: Notification) => {
      if (!n.read) {
        markNotificationRead(n.id);
      }
      if (n.relatedType === 'initiative') {
        router.push(`/app/initiatives/${n.relatedId}`);
      } else if (n.relatedType === 'document') {
        router.push(`/app/documents/${n.relatedId}`);
      } else if (n.relatedType === 'stakeholder') {
        router.push(`/app/stakeholders/${n.relatedId}`);
      }
    },
    [markNotificationRead, router]
  );

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          {unreadCount > 0 && (
            <Badge variant="red">
              {unreadCount} непрочитанных
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select
            options={TYPE_OPTIONS}
            value={filterType}
            onChange={setFilterType}
            className="w-56"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Отметить все как прочитанные
          </Button>
        </div>
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16">
          <BellOff className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">Нет уведомлений</p>
          <p className="mt-1 text-sm text-gray-400">
            {filterType !== 'all'
              ? 'Попробуйте изменить фильтр'
              : 'Новые уведомления появятся здесь'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.map((groupKey) => {
            const items = grouped[groupKey];
            if (items.length === 0) return null;

            return (
              <div key={groupKey}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {GROUP_LABELS[groupKey]}
                </h2>
                <div className="space-y-2">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'group flex items-start gap-4 rounded-lg border bg-white p-4 transition-colors hover:shadow-sm',
                        !n.read
                          ? 'border-blue-200 bg-blue-50/60'
                          : 'border-gray-200'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                          getIconContainerClass(n.type)
                        )}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Severity dot */}
                            <span
                              className={cn(
                                'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                                getSeverityDotClass(n.severity)
                              )}
                              title={getSeverityLabel(n.severity)}
                            />
                            <h3
                              className={cn(
                                'text-sm text-gray-900',
                                !n.read ? 'font-semibold' : 'font-medium'
                              )}
                            >
                              {n.title}
                            </h3>
                            <Badge
                              variant={getSeverityBadgeVariant(n.severity)}
                              className="hidden sm:inline-flex"
                            >
                              {getSeverityLabel(n.severity)}
                            </Badge>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {formatRelativeDate(n.date)}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {n.summary}
                        </p>

                        {/* Actions */}
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpen(n)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Открыть
                          </Button>
                          {!n.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(n.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Прочитано
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
