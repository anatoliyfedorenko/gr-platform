'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileEdit,
  Users,
  Bell,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS, ROLE_PERMISSIONS, type RolePermissions } from '@/lib/types';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  permissionKey: keyof RolePermissions | null;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, currentRole, notifications } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Дашборд',
      href: '/app/dashboard',
      permissionKey: 'canViewDashboard',
    },
    {
      icon: FileText,
      label: 'Инициативы',
      href: '/app/initiatives',
      permissionKey: null, // visible to all roles
    },
    {
      icon: FileEdit,
      label: 'Документы',
      href: '/app/documents',
      permissionKey: null, // visible to all roles
    },
    {
      icon: Users,
      label: 'Стейкхолдеры',
      href: '/app/stakeholders',
      permissionKey: 'canManageStakeholders',
    },
    {
      icon: Bell,
      label: 'Уведомления',
      href: '/app/notifications',
      permissionKey: null, // visible to all roles
      badge: unreadCount,
    },
    {
      icon: BarChart3,
      label: 'Отчёты',
      href: '/app/reports',
      permissionKey: 'canViewReports',
    },
    {
      icon: Settings,
      label: 'Настройки',
      href: '/app/settings',
      permissionKey: 'canEditSettings',
    },
  ];

  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : null;

  const visibleItems = navItems.filter((item) => {
    if (!item.permissionKey) return true;
    if (!permissions) return false;
    return permissions[item.permissionKey];
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-slate-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-white">GR Platform</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
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
