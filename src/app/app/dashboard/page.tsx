"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  Bell,
  AlertCircle,
  Info,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import initiativesData from "@/data/initiatives.json";
import stakeholdersData from "@/data/stakeholders.json";

// Risk mapping from English (JSON) to Russian (display)
const RISK_MAP: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

// Status mapping for chart display consistency
const STATUS_MAP: Record<string, string> = {
  "В разработке": "Разработка",
  "На рассмотрении": "Рассмотрение",
  "Принято": "Принят",
  "Отклонено": "Отклонён",
};

const STATUS_COLORS: Record<string, string> = {
  "Разработка": "#3b82f6",
  "В разработке": "#3b82f6",
  "Рассмотрение": "#f59e0b",
  "На рассмотрении": "#f59e0b",
  "Принят": "#22c55e",
  "Принято": "#22c55e",
  "Отклонён": "#ef4444",
  "Отклонено": "#ef4444",
};

const RISK_COLORS: Record<string, string> = {
  "Высокий": "#ef4444",
  "Средний": "#f59e0b",
  "Низкий": "#22c55e",
};

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="h-5 w-5 text-red-500" />,
  high: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  medium: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  low: <Info className="h-5 w-5 text-blue-500" />,
};

export default function DashboardPage() {
  const router = useRouter();
  const { currentCompanyId, currentRole, notifications } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter initiatives by company if applicable
  const initiatives = useMemo(() => {
    if (!currentCompanyId) return initiativesData;
    return initiativesData.filter((ini: any) =>
      ini.companyIds?.includes(currentCompanyId)
    );
  }, [currentCompanyId]);

  // KPI calculations
  const totalInitiatives = initiatives.length;

  const highRiskCount = initiatives.filter(
    (ini: any) => ini.risk === "high"
  ).length;

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return initiatives.filter((ini: any) => {
      if (!ini.deadline) return false;
      const deadline = new Date(ini.deadline);
      return deadline >= now && deadline <= thirtyDaysFromNow;
    }).length;
  }, [initiatives]);

  const recentInteractions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let count = 0;
    (stakeholdersData as any[]).forEach((stakeholder) => {
      if (stakeholder.interactions) {
        stakeholder.interactions.forEach((interaction: any) => {
          if (new Date(interaction.date) >= thirtyDaysAgo) {
            count++;
          }
        });
      }
    });
    return count;
  }, []);

  // Chart data: initiatives by status
  const statusChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    initiatives.forEach((ini: any) => {
      const displayStatus = STATUS_MAP[ini.status] || ini.status;
      groups[displayStatus] = (groups[displayStatus] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [initiatives]);

  // Chart data: risk distribution
  const riskChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    initiatives.forEach((ini: any) => {
      const riskLabel = RISK_MAP[ini.risk] || ini.risk;
      groups[riskLabel] = (groups[riskLabel] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [initiatives]);

  // Top 5 initiatives by relevance score
  const topInitiatives = useMemo(() => {
    return [...initiatives]
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }, [initiatives]);

  // Last 8 notifications
  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 8);
  }, [notifications]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* KPI skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        {/* Charts skeletons */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        {/* Content skeletons */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <p className="mt-1 text-sm text-gray-500">
            Обзор регуляторной активности и ключевые показатели
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Отслеживаемые инициативы"
          value={totalInitiatives}
          change={`${totalInitiatives} активных`}
          trend="neutral"
          icon={<FileText className="h-6 w-6" />}
        />
        <KPICard
          title="Высокий риск"
          value={highRiskCount}
          change={`${Math.round((highRiskCount / Math.max(totalInitiatives, 1)) * 100)}% от общего`}
          trend="down"
          icon={<AlertTriangle className="h-6 w-6" />}
          className="border-red-100"
        />
        <KPICard
          title="Ближайшие дедлайны"
          value={upcomingDeadlines}
          change="в течение 30 дней"
          trend="up"
          icon={<Clock className="h-6 w-6" />}
        />
        <KPICard
          title="Взаимодействия (30д)"
          value={recentInteractions}
          change="встреч и контактов"
          trend="up"
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart - Initiatives by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Инициативы по статусу</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusChartData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение рисков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[entry.name] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top Initiatives + Recent Updates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 Important Initiatives */}
        <Card>
          <CardHeader>
            <CardTitle>Топ-5 важных инициатив</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {topInitiatives.map((ini: any) => (
                <div
                  key={ini.id}
                  className="flex items-center justify-between gap-4 py-3 cursor-pointer hover:bg-gray-50 -mx-6 px-6 transition-colors"
                  onClick={() => router.push(`/app/initiatives/${ini.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ini.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <RiskBadge risk={RISK_MAP[ini.risk] || ini.risk} />
                      <StatusBadge status={STATUS_MAP[ini.status] || ini.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Релевантность</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {ini.relevanceScore}%
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Последние обновления</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Нет обновлений
                </p>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-3 cursor-pointer rounded-lg p-3 -mx-3 transition-colors hover:bg-gray-50",
                      !notification.read && "bg-blue-50/50"
                    )}
                    onClick={() => {
                      if (notification.relatedType === 'initiative' && notification.relatedId) {
                        router.push(
                          `/app/initiatives/${notification.relatedId}`
                        );
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {SEVERITY_ICONS[notification.severity] || (
                        <Bell className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.read
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {notification.summary}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/app/settings")}
          className="gap-2"
        >
          <Settings className="h-5 w-5" />
          Настроить мониторинг
        </Button>
      </div>
    </div>
  );
}
