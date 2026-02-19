'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  StickyNote,
  UserCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TextArea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import usersData from '@/data/users.json';
import type {
  SupportTicket,
  SupportMessage,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  User,
  Company,
} from '@/lib/types';

const users = usersData as User[];

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  bug_report: 'Ошибка',
  feature_request: 'Предложение',
  question: 'Вопрос',
  data_issue: 'Проблема с данными',
  other: 'Другое',
};

const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const STATUS_LABELS: Record<SupportStatus, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

const PRIORITY_VARIANTS: Record<SupportPriority, 'default' | 'yellow' | 'red'> = {
  low: 'default',
  medium: 'yellow',
  high: 'red',
};

const STATUS_VARIANTS: Record<SupportStatus, 'yellow' | 'blue' | 'green' | 'default'> = {
  open: 'yellow',
  in_progress: 'blue',
  resolved: 'green',
  closed: 'default',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function getUserById(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

// Mock timeline data
const MOCK_TIMELINE = [
  { action: 'Тикет создан', timestamp: '2026-02-18T09:15:00Z', actor: 'Система' },
  { action: 'Статус изменён: Открыт -> В работе', timestamp: '2026-02-18T10:30:00Z', actor: 'Администратор' },
  { action: 'Назначен: Администратор Системы', timestamp: '2026-02-18T10:31:00Z', actor: 'Администратор' },
  { action: 'Ответ пользователю', timestamp: '2026-02-18T11:00:00Z', actor: 'Администратор' },
  { action: 'Внутренняя заметка добавлена', timestamp: '2026-02-18T11:15:00Z', actor: 'Администратор' },
];

export default function AdminSupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const store = useStore() as any;
  const currentUser = store.currentUser;
  const companies: Company[] = store.companies || [];
  const allTickets: SupportTicket[] = store.supportTickets || [];
  const allMessages: SupportMessage[] = store.supportMessages || [];

  const [replyMode, setReplyMode] = useState<'none' | 'public' | 'internal'>('none');
  const [replyText, setReplyText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [browserInfoExpanded, setBrowserInfoExpanded] = useState(false);

  const ticket = useMemo(() => allTickets.find((t: SupportTicket) => t.id === id), [allTickets, id]);

  const messages = useMemo(
    () =>
      allMessages
        .filter((m: SupportMessage) => m.ticketId === id)
        .sort((a: SupportMessage, b: SupportMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allMessages, id]
  );

  const adminUsers = useMemo(
    () => users.filter((u) => u.role === 'admin'),
    []
  );

  const assignOptions = useMemo(
    () => [
      { value: '', label: 'Не назначен' },
      ...adminUsers.map((u) => ({ value: u.id, label: u.name })),
    ],
    [adminUsers]
  );

  const submitter = ticket ? getUserById(ticket.userId) : undefined;
  const companyName = ticket?.companyId
    ? companies.find((c: Company) => c.id === ticket.companyId)?.name || ticket.companyId
    : '--';

  const handleStatusChange = (newStatus: string) => {
    if (!ticket) return;
    const updates: Partial<SupportTicket> = {
      status: newStatus as SupportStatus,
      updatedAt: new Date().toISOString(),
    };
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
    }
    (useStore.getState() as any).updateSupportTicket?.(id, updates);
    toast.success(`Статус изменён: ${STATUS_LABELS[newStatus as SupportStatus]}`);
  };

  const handlePriorityChange = (newPriority: string) => {
    (useStore.getState() as any).updateSupportTicket?.(id, {
      priority: newPriority as SupportPriority,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Приоритет изменён: ${PRIORITY_LABELS[newPriority as SupportPriority]}`);
  };

  const handleCategoryChange = (newCategory: string) => {
    (useStore.getState() as any).updateSupportTicket?.(id, {
      category: newCategory as SupportCategory,
      updatedAt: new Date().toISOString(),
    });
    toast.success(`Категория изменена: ${CATEGORY_LABELS[newCategory as SupportCategory]}`);
  };

  const handleAssignChange = (userId: string) => {
    (useStore.getState() as any).updateSupportTicket?.(id, {
      assignedTo: userId || null,
      updatedAt: new Date().toISOString(),
    });
    toast.success(userId ? 'Тикет назначен' : 'Назначение снято');
  };

  const handleAssignToMe = () => {
    if (!currentUser) return;
    handleAssignChange(currentUser.id);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    const isInternal = replyMode === 'internal';

    const message: SupportMessage = {
      id: `sm-${Date.now()}`,
      ticketId: id,
      authorId: currentUser?.id || '',
      authorRole: 'admin',
      text: replyText.trim(),
      isInternal,
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    (useStore.getState() as any).addSupportMessage?.(message);
    (useStore.getState() as any).updateSupportTicket?.(id, {
      updatedAt: new Date().toISOString(),
    });

    setReplyText('');
    setReplyMode('none');
    toast.success(isInternal ? 'Внутренняя заметка добавлена' : 'Ответ отправлен пользователю');
  };

  const handleDeleteTicket = () => {
    // In a real app, would call a delete action
    toast.success('Тикет удалён');
    setDeleteModalOpen(false);
    router.push('/admin/support');
  };

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MessageSquare className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Тикет не найден</h2>
        <p className="mb-6 text-gray-500">Запрошенный тикет не существует или был удалён.</p>
        <Button variant="outline" onClick={() => router.push('/admin/support')}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Админ', href: '/admin' },
          { label: 'Поддержка', href: '/admin/support' },
          { label: `Тикет #${ticket.ticketNumber}` },
        ]}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Conversation (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Subject */}
          <h2 className="text-xl font-bold text-gray-900">{ticket.subject}</h2>

          {/* Original description */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {submitter?.name || 'Пользователь'}
                </span>
                <Badge variant="default">Пользователь</Badge>
                <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Conversation thread */}
          {messages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Переписка</h3>
              {messages.map((msg: SupportMessage) => {
                const isAdmin = msg.authorRole === 'admin';
                const isInternal = msg.isInternal;
                const authorUser = getUserById(msg.authorId);

                return (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {authorUser?.name || (isAdmin ? 'Поддержка' : 'Пользователь')}
                      </span>
                      {isInternal ? (
                        <Badge variant="yellow">Внутренняя заметка</Badge>
                      ) : isAdmin ? (
                        <Badge variant="blue">Поддержка</Badge>
                      ) : (
                        <Badge variant="default">Пользователь</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        isInternal
                          ? 'border border-yellow-300 bg-yellow-50'
                          : isAdmin
                            ? 'bg-blue-50'
                            : 'bg-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply buttons */}
          {replyMode === 'none' ? (
            <div className="flex gap-3">
              <Button onClick={() => setReplyMode('public')}>
                <Send className="h-4 w-4" />
                Ответить пользователю
              </Button>
              <Button
                variant="outline"
                onClick={() => setReplyMode('internal')}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <StickyNote className="h-4 w-4" />
                Внутренняя заметка
              </Button>
            </div>
          ) : (
            <Card className={replyMode === 'internal' ? 'border-yellow-300' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {replyMode === 'internal' ? 'Внутренняя заметка' : 'Ответ пользователю'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyMode === 'internal'
                      ? 'Заметка видна только администраторам...'
                      : 'Напишите ответ пользователю...'
                  }
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyMode('none');
                      setReplyText('');
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={
                      replyMode === 'internal' ? 'bg-yellow-600 hover:bg-yellow-700' : ''
                    }
                  >
                    <Send className="h-4 w-4" />
                    {replyMode === 'internal' ? 'Добавить заметку' : 'Отправить ответ'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Metadata + Actions (1/3) */}
        <div className="space-y-4">
          {/* Status management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Управление</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">Статус</label>
                <Select
                  options={STATUS_OPTIONS}
                  value={ticket.status}
                  onChange={handleStatusChange}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">Приоритет</label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={ticket.priority}
                  onChange={handlePriorityChange}
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">Назначен</label>
                <Select
                  options={assignOptions}
                  value={ticket.assignedTo || ''}
                  onChange={handleAssignChange}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full text-xs"
                  onClick={handleAssignToMe}
                >
                  <UserCircle className="h-3 w-3" />
                  Назначить мне
                </Button>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs text-gray-500">Категория</label>
                <Select
                  options={CATEGORY_OPTIONS}
                  value={ticket.category}
                  onChange={handleCategoryChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submitter info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Отправитель</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Имя</p>
                <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                  {submitter?.name || 'Неизвестный'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{submitter?.email || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Роль</p>
                <p className="text-sm text-gray-900">{submitter?.role || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Компания</p>
                <p className="text-sm text-gray-900">{companyName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Context info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Контекст</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Страница</p>
                <p className="text-sm text-gray-900 break-all">{ticket.pageContext || '--'}</p>
              </div>
              <div>
                <button
                  onClick={() => setBrowserInfoExpanded(!browserInfoExpanded)}
                  className="flex w-full items-center justify-between text-xs text-gray-500 hover:text-gray-700"
                >
                  <span>Информация о браузере</span>
                  {browserInfoExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                {browserInfoExpanded && (
                  <p className="mt-1 break-all rounded bg-gray-50 p-2 text-xs text-gray-600">
                    {ticket.browserInfo || '--'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                История
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_TIMELINE.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-400 mt-1.5" />
                      {idx < MOCK_TIMELINE.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-gray-700">{entry.action}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(entry.timestamp)} -- {entry.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Удалить тикет
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удалить тикет"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить тикет <strong>{ticket.ticketNumber}</strong>?
            Это действие нельзя отменить.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteTicket}>
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
