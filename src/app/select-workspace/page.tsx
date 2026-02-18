'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Users, MapPin, Factory, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import type { Company } from '@/lib/types';
import companiesData from '@/data/companies.json';

const companies = companiesData as Company[];

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { currentUser, currentRole, setCompany } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentRole !== 'consultant') {
      router.push('/app/dashboard');
      return;
    }
    setIsLoading(false);
  }, [currentUser, currentRole, router]);

  const handleSelectCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    setCompany(companyId);
    toast.success(`Рабочее пространство: ${company?.name}`);
    router.push('/app/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              useStore.getState().logout();
              router.push('/login');
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к входу
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-200">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Выберите рабочее пространство</h1>
              <p className="text-sm text-gray-500">
                Выберите компанию для работы в качестве консультанта
              </p>
            </div>
          </div>
        </div>

        {/* Company Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company.id)}
              className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>

              <h3 className="mb-1 text-base font-semibold text-gray-900">{company.name}</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>ИНН: {company.inn}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Factory className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{company.region}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{company.employees.toLocaleString('ru-RU')} сотрудников</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
