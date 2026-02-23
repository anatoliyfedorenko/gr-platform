'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Выберите отрасль' },
  { value: 'Телеком', label: 'Телеком' },
  { value: 'IT', label: 'IT' },
  { value: 'Финансы', label: 'Финансы' },
  { value: 'Энергетика', label: 'Энергетика' },
  { value: 'Телекоммуникации', label: 'Телекоммуникации' },
  { value: 'Связь и IT', label: 'Связь и IT' },
  { value: 'Инфраструктура связи', label: 'Инфраструктура связи' },
  { value: 'Цифровые услуги', label: 'Цифровые услуги' },
  { value: 'Мобильная связь', label: 'Мобильная связь' },
];

const REGION_OPTIONS = [
  { value: '', label: 'Выберите регион' },
  { value: 'Бишкек', label: 'Бишкек' },
  { value: 'Ош', label: 'Ош' },
  { value: 'Джалал-Абад', label: 'Джалал-Абад' },
  { value: 'Каракол', label: 'Каракол' },
  { value: 'Токмок', label: 'Токмок' },
  { value: 'Нарын', label: 'Нарын' },
  { value: 'Баткен', label: 'Баткен' },
];

export default function AdminCreateCompanyPage() {
  const router = useRouter();
  const { companies } = useStore();

  const [name, setName] = useState('');
  const [inn, setInn] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [employees, setEmployees] = useState('');
  const [grCenterName, setGrCenterName] = useState('');
  const [execName, setExecName] = useState('');
  const [execTitle, setExecTitle] = useState('');
  const [keyTopics, setKeyTopics] = useState('');
  const [letterCounter, setLetterCounter] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    return name.trim().length > 0 && inn.trim().length > 0;
  }, [name, inn]);

  const handleCreate = () => {
    if (!isValid) return;
    setIsSubmitting(true);

    const newCompany: Company = {
      id: `c${Date.now()}`,
      name: name.trim(),
      inn: inn.trim(),
      industry: industry || 'Другое',
      region: region || 'Не указан',
      employees: parseInt(employees) || 0,
      grCenterName: grCenterName.trim() || undefined,
      execName: execName.trim() || undefined,
      execTitle: execTitle.trim() || undefined,
      outgoingLetterNumberCounter: parseInt(letterCounter) || 100,
      keyTopics: keyTopics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    // Try store action first, fallback to direct state update
    const addCompany = (useStore.getState() as any).addCompany;
    if (typeof addCompany === 'function') {
      addCompany(newCompany);
    } else {
      useStore.setState((state) => ({
        companies: [...state.companies, newCompany],
      }));
    }

    toast.success('Компания успешно создана');
    router.push('/admin/companies');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Администрирование', href: '/admin' },
          { label: 'Компании', href: '/admin/companies' },
          { label: 'Создание' },
        ]}
      />

      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Создание компании</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название компании <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ООО Пример"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ИНН <span className="text-red-500">*</span>
              </label>
              <Input
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отрасль
                </label>
                <Select
                  options={INDUSTRY_OPTIONS}
                  value={industry}
                  onChange={setIndustry}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Регион
                </label>
                <Select
                  options={REGION_OPTIONS}
                  value={region}
                  onChange={setRegion}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество сотрудников
              </label>
              <Input
                type="number"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название GR-центра
              </label>
              <Input
                value={grCenterName}
                onChange={(e) => setGrCenterName(e.target.value)}
                placeholder="GR-департамент"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО руководителя
                </label>
                <Input
                  value={execName}
                  onChange={(e) => setExecName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Должность руководителя
                </label>
                <Input
                  value={execTitle}
                  onChange={(e) => setExecTitle(e.target.value)}
                  placeholder="Генеральный директор"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ключевые темы (через запятую)
              </label>
              <Input
                value={keyTopics}
                onChange={(e) => setKeyTopics(e.target.value)}
                placeholder="5G, Кибербезопасность, Персональные данные"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начальный номер исходящих писем
              </label>
              <Input
                type="number"
                value={letterCounter}
                onChange={(e) => setLetterCounter(e.target.value)}
                placeholder="100"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button onClick={handleCreate} disabled={!isValid || isSubmitting}>
                Создать компанию
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/companies')}
              >
                Отмена
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
