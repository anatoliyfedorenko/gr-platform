'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Users,
  Database,
  Settings,
  ScrollText,
  Brain,
  ShieldAlert,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS } from '@/lib/types';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const store = useStore();
  const currentUser = store.currentUser;
  const currentRole = store.currentRole;
  const [collapsed, setCollapsed] = useState(false);

  const supportTickets = (store as any).supportTickets || [];
  const openTicketCount = supportTickets.filter(
    (t: any) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Дашборд',
      href: '/admin/dashboard',
    },
    {
      icon: MessageSquare,
      label: 'Тикеты поддержки',
      href: '/admin/support',
      badge: openTicketCount,
    },
    {
      icon: Building2,
      label: 'Компании',
      href: '/admin/companies',
    },
    {
      icon: Users,
      label: 'Пользователи',
      href: '/admin/users',
    },
    {
      icon: Database,
      label: 'Парсеры',
      href: '/admin/parsers',
    },
    {
      icon: Settings,
      label: 'Настройки',
      href: '/admin/settings',
    },
    {
      icon: ScrollText,
      label: 'Журнал аудита',
      href: '/admin/audit',
    },
    {
      icon: Brain,
      label: 'Использование LLM',
      href: '/admin/llm-usage',
    },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-slate-950 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-white">
            Admin Panel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}

              {/* Badge */}
              {item.badge != null && item.badge > 0 && (
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
                    collapsed ? 'absolute -right-1 -top-1' : 'ml-auto'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider + Back to workspace */}
      <div className="border-t border-slate-700/50 px-3 py-3">
        <Link
          href="/app/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          title={collapsed ? 'Назад в GR Workspace' : undefined}
        >
          <ArrowLeft className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Назад в GR Workspace</span>}
        </Link>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="border-t border-slate-700/50 px-3 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-200">
                {currentUser.name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {currentUser.name.split(' ').slice(0, 2).join(' ')}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {currentRole ? ROLE_LABELS[currentRole] : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-200">
                {currentUser.name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-slate-700/50 px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
