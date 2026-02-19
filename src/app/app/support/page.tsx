'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LifeBuoy, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { SupportTicketModal } from '@/components/support/SupportTicketModal';
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

export default function SupportPage() {
  const router = useRouter();
  const store = useStore() as any;
  const currentUser = store.currentUser;
  const allTickets: SupportTicket[] = store.supportTickets || [];
  const allMessages: SupportMessage[] = store.supportMessages || [];

  const [modalOpen, setModalOpen] = useState(false);

  const tickets = useMemo(
    () => allTickets.filter((t: SupportTicket) => t.userId === currentUser?.id),
    [allTickets, currentUser?.id]
  );

  const getLastResponse = (ticketId: string): string | null => {
    const msgs = allMessages
      .filter((m: SupportMessage) => m.ticketId === ticketId && m.authorRole === 'admin' && !m.isInternal)
      .sort((a: SupportMessage, b: SupportMessage) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return msgs.length > 0 ? msgs[0].createdAt : null;
  };

  const columns: DataTableColumn<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      title: '№ тикета',
      sortable: true,
      render: (value: string) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      key: 'subject',
      title: 'Тема',
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-700 line-clamp-1">{value}</span>
      ),
    },
    {
      key: 'category',
      title: 'Категория',
      render: (value: SupportCategory) => (
        <Badge variant="default">{CATEGORY_LABELS[value] || value}</Badge>
      ),
    },
    {
      key: 'priority',
      title: 'Приоритет',
      sortable: true,
      render: (value: SupportPriority) => (
        <Badge variant={PRIORITY_VARIANTS[value] || 'default'}>
          {PRIORITY_LABELS[value] || value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Статус',
      sortable: true,
      render: (value: SupportStatus) => (
        <Badge variant={STATUS_VARIANTS[value] || 'default'}>
          {STATUS_LABELS[value] || value}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Дата создания',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      ),
    },
    {
      key: 'id',
      title: 'Последний ответ',
      render: (_: string, row: SupportTicket) => {
        const lastResp = getLastResponse(row.id);
        return lastResp ? (
          <span className="text-sm text-gray-500">{formatDate(lastResp)}</span>
        ) : (
          <span className="text-sm text-gray-400">--</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <LifeBuoy className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Мои обращения</h1>
            <Badge variant="default">{tickets.length}</Badge>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Новое обращение
        </Button>
      </div>

      {/* Tickets Table */}
      <DataTable
        columns={columns}
        data={tickets}
        onRowClick={(row) => router.push(`/app/support/${row.id}`)}
        emptyMessage="У вас пока нет обращений в поддержку"
      />

      {/* Support Ticket Modal */}
      <SupportTicketModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
