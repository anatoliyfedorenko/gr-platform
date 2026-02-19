'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS } from '@/lib/types';
import type { User, Company } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Pencil,
  Trash2,
  Ban,
  Mail,
  Shield,
  FileText,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import fallbackUsers from '@/data/users.json';

const ROLE_BADGE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'default'> = {
  gr_manager: 'blue',
  lawyer: 'purple',
  executive: 'green',
  consultant: 'orange',
  admin: 'red',
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

const MOCK_ACTIVITIES = [
  { id: 1, text: 'Создан новый документ "Аналитическая записка по 5G"', date: '2025-01-15T10:30:00Z' },
  { id: 2, text: 'Добавлен пользователь Петрова М.С.', date: '2025-01-14T14:20:00Z' },
  { id: 3, text: 'Обновлены настройки компании', date: '2025-01-13T09:15:00Z' },
  { id: 4, text: 'Создана инициатива "Регулирование OTT-сервисов"', date: '2025-01-12T16:45:00Z' },
  { id: 5, text: 'Отправлено официальное письмо в Минцифры', date: '2025-01-11T11:00:00Z' },
];

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { companies, initiatives, documents, updateCompany } = useStore();
  const users: User[] = (useStore() as any).users || (fallbackUsers as User[]);

  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('users');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editInn, setEditInn] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editEmployees, setEditEmployees] = useState('');
  const [editGrCenter, setEditGrCenter] = useState('');
  const [editExecName, setEditExecName] = useState('');
  const [editExecTitle, setEditExecTitle] = useState('');

  const company = useMemo(
    () => companies.find((c) => c.id === id),
    [companies, id]
  );

  const companyUsers = useMemo(
    () => users.filter((u) => u.companyId === id),
    [users, id]
  );

  const companyInitiatives = useMemo(
    () => initiatives.filter((ini) => (ini.companyIds || []).includes(id)),
    [initiatives, id]
  );

  const companyDocuments = useMemo(
    () => documents.filter((doc) => doc.companyId === id),
    [documents, id]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (company) {
      setEditName(company.name);
      setEditInn(company.inn);
      setEditIndustry(company.industry);
      setEditRegion(company.region);
      setEditEmployees(String(company.employees));
      setEditGrCenter(company.grCenterName || '');
      setEditExecName(company.execName || '');
      setEditExecTitle(company.execTitle || '');
    }
  }, [company]);

  const handleSaveEdit = () => {
    if (!company) return;
    updateCompany(company.id, {
      name: editName.trim(),
      inn: editInn.trim(),
      industry: editIndustry,
      region: editRegion,
      employees: parseInt(editEmployees) || 0,
      grCenterName: editGrCenter.trim() || undefined,
      execName: editExecName.trim() || undefined,
      execTitle: editExecTitle.trim() || undefined,
    });
    setIsEditing(false);
    toast.success('Данные компании обновлены');
  };

  const handleDelete = () => {
    // Remove company from store
    const removeCompany = (useStore.getState() as any).removeCompany;
    if (typeof removeCompany === 'function') {
      removeCompany(id);
    } else {
      useStore.setState((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
      }));
    }
    setShowDeleteModal(false);
    toast.success('Компания удалена');
    router.push('/admin/companies');
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

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Компания не найдена</h2>
        <p className="text-gray-500 mb-6">Запрошенная компания не существует или была удалена.</p>
        <Button variant="outline" onClick={() => router.push('/admin/companies')}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Компании', href: '/admin/companies' },
          { label: company.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{isEditing ? 'Редактирование' : company.name}</CardTitle>
                    <p className="text-sm text-gray-500">ИНН: {company.inn}</p>
                  </div>
                </div>
                <Badge variant="green">Активна</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
                      <Input value={editInn} onChange={(e) => setEditInn(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Отрасль</label>
                      <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
                      <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудники</label>
                      <Input type="number" value={editEmployees} onChange={(e) => setEditEmployees(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GR-центр</label>
                      <Input value={editGrCenter} onChange={(e) => setEditGrCenter(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ФИО руководителя</label>
                      <Input value={editExecName} onChange={(e) => setEditExecName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                      <Input value={editExecTitle} onChange={(e) => setEditExecTitle(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" onClick={handleSaveEdit}>Сохранить</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Отрасль</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Регион</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.region}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Сотрудники</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.employees.toLocaleString('ru-RU')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">GR-центр</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.grCenterName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Руководитель</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.execName || '---'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Должность</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.execTitle || '---'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Номер исх. писем</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{company.outgoingLetterNumberCounter || 100}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Ключевые темы</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(company.keyTopics || []).map((topic) => (
                        <Badge key={topic} variant="default" className="text-[10px]">{topic}</Badge>
                      ))}
                      {(!company.keyTopics || company.keyTopics.length === 0) && (
                        <span className="text-sm text-gray-400">---</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="users">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Пользователи ({companyUsers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="initiatives">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Инициативы ({companyInitiatives.length})</span>
              </TabsTrigger>
              <TabsTrigger value="documents">
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Документы ({companyDocuments.length})</span>
              </TabsTrigger>
              <TabsTrigger value="activity">
                <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Активность</span>
              </TabsTrigger>
            </TabsList>

            {/* Users tab */}
            <TabsContent value="users">
              {companyUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Нет пользователей в этой компании.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {companyUsers.map((user) => (
                    <Card key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/users/${user.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {user.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={ROLE_BADGE_VARIANT[user.role] || 'default'}>
                              {ROLE_LABELS[user.role] || user.role}
                            </Badge>
                            <span className="text-xs text-gray-400">Вход: 15.01.2025</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Initiatives tab */}
            <TabsContent value="initiatives">
              {companyInitiatives.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Нет связанных инициатив.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {companyInitiatives.map((ini) => (
                    <Card key={ini.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/app/initiatives/${ini.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ini.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="default" className="text-[10px]">{ini.status}</Badge>
                              <Badge variant={RISK_VARIANT[ini.risk] || 'default'} className="text-[10px]">
                                {RISK_LABELS[ini.risk] || ini.risk}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(ini.lastUpdated)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents tab */}
            <TabsContent value="documents">
              {companyDocuments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Нет документов для этой компании.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {companyDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/app/documents/${doc.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="default" className="text-[10px]">
                                {DOC_TYPE_LABELS[doc.type] || doc.type}
                              </Badge>
                              <Badge variant={DOC_STATUS_VARIANT[doc.status] || 'default'} className="text-[10px]">
                                {DOC_STATUS_LABELS[doc.status] || doc.status}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(doc.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity tab */}
            <TabsContent value="activity">
              <div className="space-y-3">
                {MOCK_ACTIVITIES.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{activity.text}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(activity.date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Pencil className="h-4 w-4" />
                  {isEditing ? 'Отменить редактирование' : 'Редактировать'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                  onClick={() => toast.info('Компания приостановлена (демо)')}
                >
                  <Ban className="h-4 w-4" />
                  Приостановить компанию
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить компанию
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Пользователи</span>
                  <span className="text-sm font-medium text-gray-900">{companyUsers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Инициативы</span>
                  <span className="text-sm font-medium text-gray-900">{companyInitiatives.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Документы</span>
                  <span className="text-sm font-medium text-gray-900">{companyDocuments.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удаление компании"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить компанию <strong>{company.name}</strong>? Это действие необратимо.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
