'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  LogOut,
  User,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS, type UserRole, type Company } from '@/lib/types';
import companiesData from '@/data/companies.json';

const companies = companiesData as Company[];

const breadcrumbMap: Record<string, string> = {
  app: 'Главная',
  dashboard: 'Дашборд',
  initiatives: 'Инициативы',
  documents: 'Документы',
  stakeholders: 'Стейкхолдеры',
  notifications: 'Уведомления',
  reports: 'Отчёты',
  settings: 'Настройки',
};

const allRoles: UserRole[] = ['gr_manager', 'lawyer', 'executive', 'consultant'];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentRole, currentCompanyId, logout, switchRole, setCompany } =
    useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node)
      ) {
        setCompanyDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: breadcrumbMap[segment] || segment,
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }));

  const currentCompany = companies.find((c) => c.id === currentCompanyId);

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из системы');
    router.push('/login');
  };

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setRoleDropdownOpen(false);
    toast.success(`Роль изменена: ${ROLE_LABELS[role]}`);
  };

  const handleSwitchCompany = (companyId: string) => {
    setCompany(companyId);
    setCompanyDropdownOpen(false);
    const company = companies.find((c) => c.id === companyId);
    toast.success(`Компания: ${company?.name}`);
  };

  return (
    <header className="fixed right-0 top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/95 backdrop-blur-sm transition-all ml-64">
      <div className="flex w-full items-center justify-between px-6">
        {/* Left: Breadcrumbs */}
        <nav className="flex items-center text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-300">/</span>}
              {crumb.isLast ? (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              ) : (
                <span className="text-gray-500">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 lg:w-72"
            />
          </div>

          {/* Company Selector (Consultant only) */}
          {currentRole === 'consultant' && (
            <div className="relative" ref={companyDropdownRef}>
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="hidden max-w-[140px] truncate lg:inline">
                  {currentCompany?.name || 'Компания'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {companyDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <p className="px-3 py-2 text-xs font-medium text-gray-400">
                    Рабочее пространство
                  </p>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSwitchCompany(company.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                        currentCompanyId === company.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      )}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Role Switcher */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">
                {currentRole ? ROLE_LABELS[currentRole] : 'Роль'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {roleDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <p className="px-3 py-2 text-xs font-medium text-gray-400">Переключить роль</p>
                {allRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                      currentRole === role ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                {currentUser?.name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('') || 'U'}
              </div>
              <span className="hidden max-w-[120px] truncate lg:inline">
                {currentUser?.name.split(' ').slice(0, 2).join(' ') || 'Пользователь'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-3">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/app/settings');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  Профиль
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
