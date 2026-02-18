"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Filter, ChevronDown, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn, formatDate } from "@/lib/utils";
import { Badge, StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import initiativesData from "@/data/initiatives.json";

// Risk mapping from English (JSON) to Russian (display)
const RISK_MAP: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const RISK_REVERSE_MAP: Record<string, string> = {
  "Высокий": "high",
  "Средний": "medium",
  "Низкий": "low",
};

// Status mapping for display consistency
const STATUS_MAP: Record<string, string> = {
  "В разработке": "Разработка",
  "На рассмотрении": "Рассмотрение",
  "Принято": "Принят",
  "Отклонено": "Отклонён",
};

const STATUS_REVERSE_MAP: Record<string, string[]> = {
  "Разработка": ["В разработке"],
  "Рассмотрение": ["На рассмотрении"],
  "Принят": ["Принято"],
  "Отклонён": ["Отклонено"],
};

const TOPIC_OPTIONS = [
  "5G",
  "Частоты",
  "Персональные данные",
  "Тарифы",
  "Инфраструктура",
  "Кибербезопасность",
];

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "Разработка", label: "Разработка" },
  { value: "Рассмотрение", label: "Рассмотрение" },
  { value: "Принят", label: "Принят" },
  { value: "Отклонён", label: "Отклонён" },
];

const RISK_OPTIONS = [
  { value: "", label: "Все риски" },
  { value: "Высокий", label: "Высокий" },
  { value: "Средний", label: "Средний" },
  { value: "Низкий", label: "Низкий" },
];

const REGION_OPTIONS = [
  { value: "", label: "Все регионы" },
  { value: "Федеральный", label: "Федеральный" },
  { value: "Региональный", label: "Региональный" },
];

const SORT_OPTIONS = [
  { value: "risk", label: "По риску" },
  { value: "relevance", label: "По релевантности" },
  { value: "updated", label: "По дате обновления" },
];

// Topic multi-select dropdown component
function TopicMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (topics: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "hover:border-gray-400"
        )}
      >
        <span className={cn(selected.length === 0 && "text-gray-400")}>
          {selected.length === 0
            ? "Темы"
            : `Выбрано: ${selected.length}`}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-auto p-2 space-y-1">
            {TOPIC_OPTIONS.map((topic) => (
              <label
                key={topic}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{topic}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
              >
                Сбросить выбор
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RISK_SORT_ORDER: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function InitiativesPage() {
  const router = useRouter();
  const { currentCompanyId } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter initiatives by company if applicable
  const baseInitiatives = useMemo(() => {
    if (!currentCompanyId) return initiativesData;
    return initiativesData.filter((ini: any) =>
      ini.companyIds?.includes(currentCompanyId)
    );
  }, [currentCompanyId]);

  // Apply all filters
  const filteredInitiatives = useMemo(() => {
    let result = [...baseInitiatives] as any[];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (ini) =>
          ini.title.toLowerCase().includes(searchLower) ||
          ini.summary.toLowerCase().includes(searchLower) ||
          ini.source.toLowerCase().includes(searchLower) ||
          ini.topic.toLowerCase().includes(searchLower)
      );
    }

    // Topic filter
    if (selectedTopics.length > 0) {
      result = result.filter((ini) => {
        const topicLower = ini.topic.toLowerCase();
        return selectedTopics.some((t) => topicLower.includes(t.toLowerCase()));
      });
    }

    // Status filter
    if (statusFilter) {
      const matchStatuses = STATUS_REVERSE_MAP[statusFilter] || [statusFilter];
      result = result.filter(
        (ini) =>
          matchStatuses.includes(ini.status) ||
          (STATUS_MAP[ini.status] || ini.status) === statusFilter
      );
    }

    // Risk filter
    if (riskFilter) {
      const riskKey = RISK_REVERSE_MAP[riskFilter] || riskFilter.toLowerCase();
      result = result.filter((ini) => ini.risk === riskKey);
    }

    // Region filter
    if (regionFilter) {
      if (regionFilter === "Федеральный") {
        result = result.filter((ini) => ini.region === "Федеральный");
      } else if (regionFilter === "Региональный") {
        result = result.filter((ini) => ini.region !== "Федеральный");
      }
    }

    // Sorting
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case "risk":
          return (
            (RISK_SORT_ORDER[b.risk] || 0) - (RISK_SORT_ORDER[a.risk] || 0)
          );
        case "relevance":
          return b.relevanceScore - a.relevanceScore;
        case "updated":
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [baseInitiatives, search, selectedTopics, statusFilter, riskFilter, regionFilter, sortBy]);

  const activeFilterCount = [
    search.trim() ? 1 : 0,
    selectedTopics.length > 0 ? 1 : 0,
    statusFilter ? 1 : 0,
    riskFilter ? 1 : 0,
    regionFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setSearch("");
    setSelectedTopics([]);
    setStatusFilter("");
    setRiskFilter("");
    setRegionFilter("");
  };

  const columns = [
    {
      key: "title",
      title: "Название",
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900" title={value}>
          {value.length > 60 ? `${value.slice(0, 60)}...` : value}
        </span>
      ),
    },
    {
      key: "topic",
      title: "Тема",
      sortable: true,
      render: (value: string) => <Badge variant="purple">{value}</Badge>,
    },
    {
      key: "source",
      title: "Источник",
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-600 text-xs">{value}</span>
      ),
    },
    {
      key: "status",
      title: "Статус",
      sortable: true,
      render: (value: string) => (
        <StatusBadge status={STATUS_MAP[value] || value} />
      ),
    },
    {
      key: "risk",
      title: "Риск",
      sortable: true,
      render: (value: string) => <RiskBadge risk={RISK_MAP[value] || value} />,
    },
    {
      key: "relevanceScore",
      title: "Релевантность",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                value >= 80
                  ? "bg-blue-600"
                  : value >= 60
                    ? "bg-blue-400"
                    : "bg-blue-300"
              )}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 w-8">
            {value}%
          </span>
        </div>
      ),
    },
    {
      key: "lastUpdated",
      title: "Обновлено",
      sortable: true,
      render: (value: string) => (
        <span className="text-xs text-gray-500">
          {value ? formatDate(value) : "\u2014"}
        </span>
      ),
    },
    {
      key: "deadline",
      title: "Дедлайн",
      sortable: true,
      render: (value: string) => {
        if (!value) return <span className="text-gray-400">{"\u2014"}</span>;
        const deadline = new Date(value);
        const now = new Date();
        const daysLeft = Math.ceil(
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isUrgent = daysLeft <= 30 && daysLeft > 0;
        const isPast = daysLeft < 0;
        return (
          <span
            className={cn(
              "text-xs",
              isPast
                ? "text-red-600 font-medium"
                : isUrgent
                  ? "text-amber-600 font-medium"
                  : "text-gray-500"
            )}
          >
            {formatDate(value)}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Инициативы</h1>
        <Badge variant="blue">{baseInitiatives.length}</Badge>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по названию, теме, источнику..."
            className="w-72"
          />
          <div className="w-48">
            <TopicMultiSelect
              selected={selectedTopics}
              onChange={setSelectedTopics}
            />
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-44"
          />
          <Select
            options={RISK_OPTIONS}
            value={riskFilter}
            onChange={setRiskFilter}
            className="w-36"
          />
          <Select
            options={REGION_OPTIONS}
            value={regionFilter}
            onChange={setRegionFilter}
            className="w-44"
          />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            className="w-48"
          />

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500"
            >
              <X className="h-4 w-4" />
              Сбросить ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Active topic chips */}
        {selectedTopics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-medium text-purple-700"
              >
                {topic}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTopics(selectedTopics.filter((t) => t !== topic))
                  }
                  className="ml-0.5 hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInitiatives}
        onRowClick={(row: any) => router.push(`/app/initiatives/${row.id}`)}
        pageSize={10}
        emptyMessage={
          activeFilterCount > 0
            ? "Не найдено инициатив, соответствующих фильтрам. Попробуйте изменить параметры поиска."
            : "Нет данных для отображения"
        }
      />

      {/* Results count */}
      {filteredInitiatives.length !== baseInitiatives.length && (
        <p className="text-sm text-gray-500">
          Найдено: {filteredInitiatives.length} из {baseInitiatives.length}{" "}
          инициатив
        </p>
      )}
    </div>
  );
}
