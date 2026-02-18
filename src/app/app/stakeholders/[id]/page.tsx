'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_PERMISSIONS } from '@/lib/types';
import type { Interaction } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
  Briefcase,
  PhoneCall,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  government: 'Государственный орган',
  regulator: 'Регулятор',
  industry: 'Отраслевой эксперт',
};

const TYPE_VARIANT: Record<string, 'blue' | 'purple' | 'orange' | 'default'> = {
  government: 'blue',
  regulator: 'purple',
  industry: 'orange',
};

const POSITION_LABELS: Record<string, string> = {
  supportive: 'Поддержка',
  neutral: 'Нейтральная',
  opposed: 'Оппозиция',
  unknown: 'Неизвестно',
};

const POSITION_VARIANT: Record<string, 'green' | 'default' | 'red' | 'blue'> = {
  supportive: 'green',
  neutral: 'default',
  opposed: 'red',
  unknown: 'blue',
};

const INFLUENCE_NUM: Record<string, number> = {
  high: 5,
  medium: 3,
  low: 1,
};

const RISK_LABELS: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const RISK_VARIANT: Record<string, 'red' | 'yellow' | 'green' | 'default'> = {
  high: 'red',
  medium: 'yellow',
  low: 'green',
};

const STATUS_VARIANT: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'default'> = {
  'В разработке': 'blue',
  'На рассмотрении': 'yellow',
  'Принято': 'green',
  'Отклонён': 'red',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  approved: 'Утверждён',
  sent: 'Отправлен',
  in_review: 'На рассмотрении',
};

const DOC_STATUS_VARIANT: Record<string, 'default' | 'green' | 'blue' | 'yellow'> = {
  draft: 'default',
  approved: 'green',
  sent: 'blue',
  in_review: 'yellow',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  position_paper: 'Служебная записка',
  legal_opinion: 'Юридическое заключение',
  letter: 'Официальное письмо',
  proposal: 'Предложение поправок',
  briefing: 'Справка',
  analysis: 'Аналитическая записка',
};

const interactionTypeOptions = [
  { value: 'meeting', label: 'Встреча' },
  { value: 'call', label: 'Звонок' },
  { value: 'email', label: 'Email' },
];

function InteractionIcon({ type }: { type: string }) {
  switch (type) {
    case 'meeting':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'call':
      return <PhoneCall className="h-4 w-4 text-green-500" />;
    case 'email':
      return <Mail className="h-4 w-4 text-purple-500" />;
    case 'letter':
      return <FileText className="h-4 w-4 text-orange-500" />;
    case 'conference':
      return <Video className="h-4 w-4 text-indigo-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
  }
}

function InfluenceDots({ level }: { level: string }) {
  const count = INFLUENCE_NUM[level] || 1;
  return (
    <span className="inline-flex items-center gap-1" title={`Влияние: ${count}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            i < count ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        />
      ))}
    </span>
  );
}

export default function StakeholderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    stakeholders,
    initiatives,
    documents,
    currentRole,
    currentUser,
    addInteraction,
  } = useStore();
  const permissions = ROLE_PERMISSIONS[currentRole];

  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  // Interaction form state
  const [intType, setIntType] = useState('meeting');
  const [intDate, setIntDate] = useState(new Date().toISOString().split('T')[0]);
  const [intParticipants, setIntParticipants] = useState('');
  const [intOutcome, setIntOutcome] = useState('');
  const [intNextSteps, setIntNextSteps] = useState('');
  const [intInitiativeId, setIntInitiativeId] = useState('');
  const [intDocumentId, setIntDocumentId] = useState('');

  const stakeholder = useMemo(() => stakeholders.find((s) => s.id === id), [stakeholders, id]);

  const relatedInitiatives = useMemo(
    () =>
      stakeholder
        ? initiatives.filter((i) => i.stakeholderIds.includes(stakeholder.id))
        : [],
    [stakeholder, initiatives]
  );

  const relatedDocuments = useMemo(
    () =>
      stakeholder
        ? documents.filter((d) => d.relatedStakeholderIds.includes(stakeholder.id))
        : [],
    [stakeholder, documents]
  );

  const initiativeOptions = useMemo(
    () => [
      { value: '', label: 'Без привязки' },
      ...initiatives.map((i) => ({ value: i.id, label: i.title })),
    ],
    [initiatives]
  );

  const documentOptions = useMemo(
    () => [
      { value: '', label: 'Без привязки' },
      ...documents.map((d) => ({ value: d.id, label: d.title })),
    ],
    [documents]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const resetInteractionForm = () => {
    setIntType('meeting');
    setIntDate(new Date().toISOString().split('T')[0]);
    setIntParticipants('');
    setIntOutcome('');
    setIntNextSteps('');
    setIntInitiativeId('');
    setIntDocumentId('');
  };

  const handleSaveInteraction = () => {
    if (!stakeholder || !intOutcome.trim()) return;

    const participantsArr = intParticipants
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const interaction: Interaction = {
      id: `int_${Date.now()}`,
      type: intType,
      date: intDate,
      summary: intOutcome,
      participants: participantsArr.length > 0 ? participantsArr : [currentUser?.name || 'Пользователь'],
      outcome: intOutcome,
      nextSteps: intNextSteps,
      ...(intInitiativeId ? { initiativeId: intInitiativeId } : {}),
      ...(intDocumentId ? { documentId: intDocumentId } : {}),
    };

    addInteraction(stakeholder.id, interaction);
    toast.success('Взаимодействие записано');
    setShowInteractionModal(false);
    resetInteractionForm();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!stakeholder) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Стейкхолдер не найден</h2>
        <p className="text-gray-500 mb-6">Запрошенный профиль не существует или был удалён.</p>
        <Button variant="outline" onClick={() => router.push('/app/stakeholders')}>
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
          { label: 'Стейкхолдеры', href: '/app/stakeholders' },
          { label: stakeholder.name },
        ]}
      />

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
                  {stakeholder.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{stakeholder.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{stakeholder.organization}</span>
                    <span className="text-gray-300">|</span>
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{stakeholder.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={TYPE_VARIANT[stakeholder.type] || 'default'}>
                  {TYPE_LABELS[stakeholder.type] || stakeholder.type}
                </Badge>
                <Badge variant={POSITION_VARIANT[stakeholder.position] || 'default'}>
                  {POSITION_LABELS[stakeholder.position] || stakeholder.position}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Влияние:</span>
                  <InfluenceDots level={stakeholder.influence} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {stakeholder.topics.map((topic) => (
                  <Badge key={topic} variant="default" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 text-sm min-w-[200px]">
              {stakeholder.contacts.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{stakeholder.contacts.email}</span>
                </div>
              )}
              {stakeholder.contacts.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{stakeholder.contacts.phone}</span>
                </div>
              )}
              {stakeholder.contacts.assistant && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{stakeholder.contacts.assistant}</span>
                </div>
              )}
              {stakeholder.lastInteraction && (
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Последний контакт: {formatDate(stakeholder.lastInteraction)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="interactions">Взаимодействия</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Заметки</CardTitle>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Добавить заметки о стейкхолдере..."
                  rows={6}
                  className="mb-3"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toast.success('Заметки сохранены')}
                >
                  Сохранить заметки
                </Button>
              </CardContent>
            </Card>

            {/* Related initiatives */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Связанные инициативы ({relatedInitiatives.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedInitiatives.length === 0 ? (
                  <p className="text-sm text-gray-500">Нет связанных инициатив.</p>
                ) : (
                  <ul className="space-y-3">
                    {relatedInitiatives.map((ini) => (
                      <li key={ini.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0">
                          <Link
                            href={`/app/initiatives/${ini.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline block truncate"
                          >
                            {ini.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={STATUS_VARIANT[ini.status] || 'default'} className="text-[10px]">
                              {ini.status}
                            </Badge>
                            <Badge variant={RISK_VARIANT[ini.risk] || 'default'} className="text-[10px]">
                              {RISK_LABELS[ini.risk] || ini.risk}
                            </Badge>
                          </div>
                        </div>
                        <Link href={`/app/initiatives/${ini.id}`}>
                          <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interactions tab */}
        <TabsContent value="interactions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                История взаимодействий ({stakeholder.interactions.length})
              </h3>
              {permissions.canEdit && (
                <Button size="sm" onClick={() => setShowInteractionModal(true)}>
                  <Plus className="h-4 w-4" />
                  Записать взаимодействие
                </Button>
              )}
            </div>

            {stakeholder.interactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Нет записей о взаимодействиях.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

                <div className="space-y-4">
                  {[...stakeholder.interactions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((interaction) => (
                      <div key={interaction.id} className="relative flex gap-4 pl-2">
                        <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex-shrink-0 mt-1">
                          <InteractionIcon type={interaction.type} />
                        </div>
                        <Card className="flex-1">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs capitalize">
                                  {interaction.type === 'meeting'
                                    ? 'Встреча'
                                    : interaction.type === 'call'
                                    ? 'Звонок'
                                    : interaction.type === 'email'
                                    ? 'Email'
                                    : interaction.type === 'letter'
                                    ? 'Письмо'
                                    : interaction.type === 'conference'
                                    ? 'Конференция'
                                    : interaction.type}
                                </Badge>
                                {interaction.initiativeId && (
                                  <Link
                                    href={`/app/initiatives/${interaction.initiativeId}`}
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    {initiatives.find((i) => i.id === interaction.initiativeId)
                                      ?.title || interaction.initiativeId}
                                  </Link>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatDate(interaction.date)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{interaction.summary}</p>
                            {interaction.participants && interaction.participants.length > 0 && (
                              <p className="text-xs text-gray-500 mb-1">
                                <span className="font-medium">Участники:</span>{' '}
                                {Array.isArray(interaction.participants)
                                  ? interaction.participants.join(', ')
                                  : interaction.participants}
                              </p>
                            )}
                            {interaction.outcome && interaction.outcome !== interaction.summary && (
                              <p className="text-xs text-gray-500 mb-1">
                                <span className="font-medium">Итог:</span> {interaction.outcome}
                              </p>
                            )}
                            {interaction.nextSteps && (
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Следующие шаги:</span>{' '}
                                {interaction.nextSteps}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              Связанные документы ({relatedDocuments.length})
            </h3>

            {relatedDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Нет связанных документов.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {relatedDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/app/documents/${doc.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/app/documents/${doc.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline block"
                          >
                            {doc.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="default" className="text-[10px]">
                              {DOC_TYPE_LABELS[doc.type] || doc.type}
                            </Badge>
                            <Badge
                              variant={DOC_STATUS_VARIANT[doc.status] || 'default'}
                              className="text-[10px]"
                            >
                              {DOC_STATUS_LABELS[doc.status] || doc.status}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(doc.updatedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Log interaction modal */}
      <Modal
        open={showInteractionModal}
        onClose={() => {
          setShowInteractionModal(false);
          resetInteractionForm();
        }}
        title="Записать взаимодействие"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
              <Select
                options={interactionTypeOptions}
                value={intType}
                onChange={setIntType}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
              <Input
                type="date"
                value={intDate}
                onChange={(e) => setIntDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Участники (через запятую)
            </label>
            <TextArea
              value={intParticipants}
              onChange={(e) => setIntParticipants(e.target.value)}
              placeholder="Иванов А.П., Петров В.С."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Итог</label>
            <TextArea
              value={intOutcome}
              onChange={(e) => setIntOutcome(e.target.value)}
              placeholder="Краткое описание результатов..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Следующие шаги
            </label>
            <TextArea
              value={intNextSteps}
              onChange={(e) => setIntNextSteps(e.target.value)}
              placeholder="Какие шаги необходимо предпринять далее..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Связанная инициатива
              </label>
              <Select
                options={initiativeOptions}
                value={intInitiativeId}
                onChange={setIntInitiativeId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Связанный документ
              </label>
              <Select
                options={documentOptions}
                value={intDocumentId}
                onChange={setIntDocumentId}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInteractionModal(false);
                resetInteractionForm();
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleSaveInteraction} disabled={!intOutcome.trim()}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
