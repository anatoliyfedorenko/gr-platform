'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LifeBuoy, Send, Download, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TextArea } from '@/components/ui/textarea';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import type {
  SupportTicket,
  SupportMessage,
  SupportCategory,
  SupportPriority,
  SupportStatus,
} from '@/lib/types';

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

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const store = useStore() as any;
  const currentUser = store.currentUser;
  const allTickets: SupportTicket[] = store.supportTickets || [];
  const allMessages: SupportMessage[] = store.supportMessages || [];

  const [replyText, setReplyText] = useState('');

  const ticket = useMemo(() => allTickets.find((t: SupportTicket) => t.id === id), [allTickets, id]);

  const messages = useMemo(
    () =>
      allMessages
        .filter((m: SupportMessage) => m.ticketId === id && !m.isInternal)
        .sort((a: SupportMessage, b: SupportMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allMessages, id]
  );

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    const message: SupportMessage = {
      id: `sm-${Date.now()}`,
      ticketId: id,
      authorId: currentUser?.id || '',
      authorRole: 'user',
      text: replyText.trim(),
      isInternal: false,
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    (useStore.getState() as any).addSupportMessage?.(message);
    setReplyText('');
    toast.success('Ответ отправлен');
  };

  const handleReopenTicket = () => {
    (useStore.getState() as any).updateSupportTicket?.(id, {
      status: 'open',
      resolvedAt: null,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Тикет переоткрыт');
  };

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LifeBuoy className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Тикет не найден</h2>
        <p className="mb-6 text-gray-500">Запрошенное обращение не существует или было удалено.</p>
        <Button variant="outline" onClick={() => router.push('/app/support')}>
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
          { label: 'Поддержка', href: '/app/support' },
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
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Вложения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{att.filename}</span>
                      <Download className="ml-auto h-4 w-4 cursor-pointer text-gray-400 hover:text-blue-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation thread */}
          {messages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Переписка</h3>
              {messages.map((msg: SupportMessage) => {
                const isUser = msg.authorRole === 'user';
                return (
                  <div key={msg.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {isUser ? (currentUser?.name || 'Пользователь') : 'Поддержка'}
                      </span>
                      <Badge variant={isUser ? 'default' : 'blue'}>
                        {isUser ? 'Вы' : 'Поддержка'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        isUser ? 'bg-gray-100' : 'bg-blue-50'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply box */}
          {ticket.status !== 'closed' && (
            <Card>
              <CardContent className="pt-6">
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Напишите ответ..."
                  rows={4}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <Send className="h-4 w-4" />
                    Отправить ответ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Metadata (1/3) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Статус</p>
                <Badge
                  variant={STATUS_VARIANTS[ticket.status] || 'default'}
                  className="text-sm px-3 py-1"
                >
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </Badge>
              </div>

              {/* Priority */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Приоритет</p>
                <Badge variant={PRIORITY_VARIANTS[ticket.priority] || 'default'}>
                  {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                </Badge>
              </div>

              {/* Category */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Категория</p>
                <Badge variant="default">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </Badge>
              </div>

              {/* Created date */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Создан</p>
                <p className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</p>
              </div>

              {/* Updated date */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Обновлён</p>
                <p className="text-sm text-gray-900">{formatDate(ticket.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Resolved banner */}
          {ticket.status === 'resolved' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <p className="mb-3 text-sm text-green-800">
                  Тикет решён. Если проблема не устранена, вы можете переоткрыть его.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleReopenTicket}
                >
                  <RefreshCw className="h-4 w-4" />
                  Переоткрыть
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
