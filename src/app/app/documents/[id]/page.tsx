'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_PERMISSIONS } from '@/lib/types';
import type { Document, DocumentSection } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  CheckCircle,
  Send,
  Download,
  MessageSquare,
  FileText,
  Link as LinkIcon,
  Calendar,
  User,
  Building2,
  Tag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  position_paper: 'Служебная записка',
  legal_opinion: 'Юридическое заключение',
  letter: 'Официальное письмо',
  proposal: 'Предложение поправок',
  briefing: 'Справка',
  analysis: 'Аналитическая записка',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  approved: 'Утверждён',
  sent: 'Отправлен',
  in_review: 'На рассмотрении',
};

const STATUS_VARIANT: Record<string, 'default' | 'green' | 'blue' | 'yellow'> = {
  draft: 'default',
  approved: 'green',
  sent: 'blue',
  in_review: 'yellow',
};

const USERS_MAP: Record<string, string> = {
  u1: 'Иванов Алексей Петрович',
  u2: 'Петрова Мария Сергеевна',
  u3: 'Сидоров Дмитрий Владимирович',
  u4: 'Козлова Анна Игоревна',
  u5: 'Морозов Сергей Александрович',
  u6: 'Волкова Елена Николаевна',
  u7: 'Новиков Андрей Викторович',
  u8: 'Федорова Ольга Дмитриевна',
};

const COMPANIES_MAP: Record<string, string> = {
  c1: 'ООО Телеком Север',
  c2: 'АО ВекторСвязь',
  c3: 'ООО ИнфраНет',
  c4: 'ПАО Цифровые Решения',
  c5: 'ООО СпектрТелеком',
};

interface Comment {
  author: string;
  date: string;
  text: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { documents, initiatives, stakeholders, currentRole, currentUser, updateDocument } = useStore();
  const permissions = ROLE_PERMISSIONS[currentRole];

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const document = useMemo(() => documents.find((d) => d.id === id), [documents, id]);

  const relatedInitiative = useMemo(
    () => (document?.initiativeId ? initiatives.find((i) => i.id === document.initiativeId) : null),
    [document, initiatives]
  );

  const relatedStakeholders = useMemo(
    () =>
      document
        ? stakeholders.filter((s) => document.relatedStakeholderIds.includes(s.id))
        : [],
    [document, stakeholders]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setSections(document.content.sections.map((s) => ({ ...s })));
    }
  }, [document]);

  const canEdit = permissions.canEdit;
  const canApprove = permissions.canApprove;

  const handleSaveDraft = () => {
    if (!document) return;
    updateDocument(document.id, {
      title,
      content: { sections },
      updatedAt: new Date().toISOString().split('T')[0],
    });
    toast.success('Черновик сохранён');
  };

  const handleApprove = () => {
    if (!document) return;
    updateDocument(document.id, {
      status: 'approved',
      updatedAt: new Date().toISOString().split('T')[0],
    });
    toast.success('Документ утверждён');
  };

  const handleMarkSent = () => {
    if (!document) return;
    updateDocument(document.id, {
      status: 'sent',
      updatedAt: new Date().toISOString().split('T')[0],
    });
    toast.success('Документ отмечен как отправленный');
  };

  const handleExportPDF = () => {
    setExportModalOpen(true);
  };

  const handleDownloadExport = () => {
    if (!document) return;
    const textContent = [
      document.title,
      '='.repeat(document.title.length),
      '',
      ...sections.flatMap((s) => [s.title, '-'.repeat(s.title.length), s.text, '']),
      `Дата: ${formatDate(document.updatedAt)}`,
      `Статус: ${STATUS_LABELS[document.status] || document.status}`,
    ].join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 ]/g, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
    toast.success('Документ экспортирован');
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      author: currentUser?.name || 'Аноним',
      date: new Date().toISOString(),
      text: commentText.trim(),
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
    toast.success('Комментарий добавлен');
  };

  const handleSectionClick = (index: number) => {
    setActiveSection(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateSectionText = (index: number, text: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text } : s))
    );
  };

  const updateSectionTitle = (index: number, newTitle: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s))
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="flex gap-6">
          <Skeleton className="h-[400px] w-48 flex-shrink-0" />
          <Skeleton className="h-[400px] flex-1" />
          <Skeleton className="h-[400px] w-72 flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Документ не найден</h2>
        <p className="text-gray-500 mb-6">Запрошенный документ не существует или был удалён.</p>
        <Button variant="outline" onClick={() => router.push('/app/documents')}>
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
          { label: 'Документы', href: '/app/documents' },
          { label: title },
        ]}
      />

      {/* Three-column layout */}
      <div className="flex gap-6">
        {/* Left column - Section outline */}
        <div className="w-48 flex-shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Разделы</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-1">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSectionClick(idx)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                      activeSection === idx
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {section.title || `Раздел ${idx + 1}`}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main column - Document editor */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              {canEdit ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-bold border-none shadow-none px-0 focus:ring-0 text-gray-900"
                  placeholder="Название документа"
                />
              ) : (
                <CardTitle className="text-xl">{title}</CardTitle>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  ref={(el) => { sectionRefs.current[idx] = el; }}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    activeSection === idx ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                  )}
                  onClick={() => setActiveSection(idx)}
                >
                  {canEdit ? (
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(idx, e.target.value)}
                      className="text-base font-semibold border-none shadow-none px-0 focus:ring-0 mb-3 text-gray-900"
                      placeholder="Заголовок раздела"
                    />
                  ) : (
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {section.title}
                    </h3>
                  )}
                  {canEdit ? (
                    <TextArea
                      value={section.text}
                      onChange={(e) => updateSectionText(idx, e.target.value)}
                      rows={6}
                      className="resize-y"
                      placeholder="Текст раздела..."
                    />
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {section.text}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Metadata & Actions */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Metadata card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Тип</p>
                  <Badge variant={STATUS_VARIANT[document.type] || 'default'} className="mt-0.5">
                    {TYPE_LABELS[document.type] || document.type}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Статус</p>
                  <Badge variant={STATUS_VARIANT[document.status]} className="mt-0.5">
                    {STATUS_LABELS[document.status] || document.status}
                  </Badge>
                </div>
              </div>

              {relatedInitiative && (
                <div className="flex items-start gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Инициатива</p>
                    <Link
                      href={`/app/initiatives/${relatedInitiative.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {relatedInitiative.title}
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Компания</p>
                  <p className="text-sm text-gray-900">
                    {COMPANIES_MAP[document.companyId] || document.companyId}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Автор</p>
                  <p className="text-sm text-gray-900">
                    {USERS_MAP[document.owner] || document.owner}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Создан</p>
                  <p className="text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Обновлён</p>
                  <p className="text-sm text-gray-900">{formatDate(document.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related stakeholders */}
          {relatedStakeholders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Стейкхолдеры
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {relatedStakeholders.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/stakeholders/${s.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-gray-500">{s.organization}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEdit && (
                <Button onClick={handleSaveDraft} className="w-full" size="sm">
                  <Save className="h-4 w-4" />
                  Сохранить черновик
                </Button>
              )}
              {canApprove && document.status !== 'approved' && document.status !== 'sent' && (
                <Button onClick={handleApprove} variant="secondary" className="w-full" size="sm">
                  <CheckCircle className="h-4 w-4" />
                  Утвердить
                </Button>
              )}
              {canEdit && document.status === 'approved' && (
                <Button onClick={handleMarkSent} variant="outline" className="w-full" size="sm">
                  <Send className="h-4 w-4" />
                  Отметить как отправлен
                </Button>
              )}
              <Button onClick={handleExportPDF} variant="outline" className="w-full" size="sm">
                <Download className="h-4 w-4" />
                Экспорт PDF
              </Button>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Комментарии ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <TextArea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  rows={3}
                  className="text-sm"
                />
                <Button
                  onClick={handleAddComment}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={!commentText.trim()}
                >
                  Добавить комментарий
                </Button>
              </div>

              {comments.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  {comments.map((comment, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.date)}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Экспорт документа"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Документ успешно экспортирован
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {title.replace(/[^a-zA-Zа-яА-ЯёЁ0-9 ]/g, '')}.pdf
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              Закрыть
            </Button>
            <Button size="sm" onClick={handleDownloadExport}>
              <Download className="h-4 w-4" />
              Скачать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
