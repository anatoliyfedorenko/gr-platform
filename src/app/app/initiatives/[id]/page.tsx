"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  FileText,
  Send,
  Edit3,
  Presentation,
  ChevronRight,
  Star,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Shield,
  ListChecks,
  Newspaper,
  Users,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { ROLE_PERMISSIONS } from "@/lib/types";
import type { TemplateType } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Badge, StatusBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateWizard } from "@/components/templates/TemplateWizard";

import initiativesData from "@/data/initiatives.json";
import stakeholdersData from "@/data/stakeholders.json";

// Risk mapping
const RISK_MAP: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const STATUS_MAP: Record<string, string> = {
  "В разработке": "Разработка",
  "На рассмотрении": "Рассмотрение",
  "Принято": "Принят",
  "Отклонено": "Отклонён",
};

const SENTIMENT_MAP: Record<string, { label: string; variant: "green" | "red" | "default" }> = {
  positive: { label: "Позитивный", variant: "green" },
  negative: { label: "Негативный", variant: "red" },
  neutral: { label: "Нейтральный", variant: "default" },
};

const POSITION_MAP: Record<string, { label: string; variant: "green" | "red" | "yellow" | "default" }> = {
  supportive: { label: "Поддерживает", variant: "green" },
  opposed: { label: "Против", variant: "red" },
  neutral: { label: "Нейтральный", variant: "yellow" },
};

// Impact area generation based on topic
function getImpactAreas(topic: string): string[] {
  const baseAreas: Record<string, string[]> = {
    "Регулирование ПВТ": [
      "Изменение налоговых преференций для резидентов ПВТ",
      "Новые требования к отчётности перед Дирекцией ПВТ",
      "Влияние на условия получения и сохранения статуса резидента",
      "Изменение конкурентной среды среди IT-компаний",
    ],
    "Цифровой кодекс": [
      "Новые требования к цифровым сервисам и платформам",
      "Регулирование электронной идентификации и ЭЦП",
      "Обязательства по интеграции с системой Тундук",
      "Изменение правил обработки электронных данных",
    ],
    "Защита данных": [
      "Требования по локализации персональных данных в КР",
      "Необходимость назначения ответственного за защиту данных",
      "Штрафные санкции за нарушение порядка обработки данных",
      "Юридические риски при трансграничной передаче данных",
    ],
    "Налоговые преференции": [
      "Снижение налоговой нагрузки для резидентов ПВТ",
      "Оптимизация структуры затрат компании",
      "Привлечение квалифицированных IT-специалистов",
    ],
    "Электронная коммерция": [
      "Новые требования к онлайн-платформам и маркетплейсам",
      "Регулирование электронных платежей и расчётов",
      "Защита прав потребителей в цифровой среде",
    ],
    "Телекоммуникации": [
      "Регулирование тарифов и условий лицензирования",
      "Требования к покрытию и качеству связи",
      "Влияние на планы развития сети и инфраструктуры",
      "Перераспределение частотного ресурса",
    ],
    "Кибербезопасность": [
      "Затраты на сертификацию оборудования и ПО",
      "Внедрение новых стандартов информационной безопасности",
      "Необходимость обучения персонала",
      "Модернизация систем мониторинга и защиты",
    ],
    "Экспорт IT-услуг": [
      "Упрощение валютного контроля для IT-экспортёров",
      "Налоговые льготы на экспортную выручку",
      "Требования к отчётности по внешнеторговым операциям",
    ],
  };
  return baseAreas[topic] || [
    "Прямое влияние на операционную деятельность",
    "Изменение нормативных требований",
    "Финансовые последствия для бизнеса",
  ];
}

// Economic impact generation
function getEconomicImpact(risk: string, relevanceScore: number): string {
  const base = risk === "high" ? 300 : risk === "medium" ? 100 : 30;
  const multiplier = relevanceScore / 100;
  const lower = Math.round(base * multiplier * 0.7);
  const upper = Math.round(base * multiplier * 1.5);
  return `${lower * 1_000_000} \u2013 ${upper * 1_000_000}`;
}

function formatRubles(value: string): string {
  return value
    .split(" \u2013 ")
    .map((v) => {
      const num = parseInt(v);
      return num.toLocaleString("ru-RU") + " \u20BD";
    })
    .join(" \u2013 ");
}

// Relevance explanation
function getRelevanceExplanation(
  relevanceScore: number,
  topic: string
): string {
  if (relevanceScore >= 90) {
    return `Данная инициатива имеет критическую значимость для компании. Тема "${topic}" напрямую затрагивает ключевые направления деятельности. Рекомендуется незамедлительное реагирование и активное участие в обсуждении.`;
  }
  if (relevanceScore >= 75) {
    return `Инициатива имеет высокую релевантность. Тема "${topic}" существенно влияет на бизнес-процессы. Рекомендуется внимательный мониторинг и подготовка позиции.`;
  }
  return `Инициатива представляет умеренный интерес. Тема "${topic}" может оказать косвенное влияние на деятельность компании. Рекомендуется периодический мониторинг.`;
}

// Risk explanation
function getRiskExplanation(risk: string, title: string): string {
  const explanations: Record<string, string> = {
    high: `Инициатива "${title}" представляет высокий уровень риска. Ожидается существенное влияние на финансовые показатели и операционную деятельность. Требуется разработка плана реагирования и активная работа со стейкхолдерами.`,
    medium: `Инициатива "${title}" несёт умеренный риск. Потенциальное влияние на отдельные направления деятельности. Рекомендуется мониторинг развития ситуации и подготовка превентивных мер.`,
    low: `Инициатива "${title}" оценивается с низким уровнем риска. Минимальное прямое влияние на деятельность компании. Достаточно регулярного отслеживания изменений.`,
  };
  return explanations[risk] || explanations.medium;
}

export default function InitiativeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { currentRole, notifications } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isTracking, setIsTracking] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | undefined>(undefined);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Close actions dropdown on outside click
  useEffect(() => {
    function handleClick() {
      setShowActionsDropdown(false);
    }
    if (showActionsDropdown) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showActionsDropdown]);

  const initiative = useMemo(() => {
    return (initiativesData as any[]).find((ini) => ini.id === id) || null;
  }, [id]);

  const stakeholders = useMemo(() => {
    if (!initiative?.stakeholderIds) return [];
    return (stakeholdersData as any[]).filter((s) =>
      initiative.stakeholderIds.includes(s.id)
    );
  }, [initiative]);

  // Permission check
  const canCreate = useMemo(() => {
    if (!currentRole) return false;
    const perms = ROLE_PERMISSIONS[currentRole];
    return perms?.canCreate ?? false;
  }, [currentRole]);

  const riskLabel = initiative ? RISK_MAP[initiative.risk] || initiative.risk : "";
  const statusLabel = initiative
    ? STATUS_MAP[initiative.status] || initiative.status
    : "";

  const handleTrackToggle = () => {
    setIsTracking(!isTracking);
    toast.success(
      isTracking
        ? "Инициатива удалена из отслеживаемых"
        : "Инициатива добавлена в отслеживаемые"
    );
  };

  const handleCreateTask = () => {
    toast.success("Задача создана", {
      description: `Задача по инициативе "${initiative?.title}" добавлена в список`,
    });
  };

  const openTemplateWizard = (template: TemplateType) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-6 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Инициатива не найдена
        </h2>
        <p className="text-gray-500 mb-4">
          Инициатива с идентификатором &quot;{id}&quot; не существует.
        </p>
        <Button onClick={() => router.push("/app/initiatives")}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Инициативы", href: "/app/initiatives" },
          { label: initiative.title },
        ]}
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold text-gray-900 flex-1 min-w-0">
            {initiative.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={statusLabel} />
          <RiskBadge risk={riskLabel} />
          <Badge variant="default">{initiative.source}</Badge>
          <Badge variant="blue">{initiative.region}</Badge>
          <span className="text-sm text-gray-500 ml-2">
            Релевантность: {initiative.relevanceScore}%
          </span>
        </div>
      </div>

      {/* Main Content + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="changes">Изменения</TabsTrigger>
              <TabsTrigger value="impact">Влияние</TabsTrigger>
              <TabsTrigger value="stakeholders">Стейкхолдеры</TabsTrigger>
              <TabsTrigger value="media">Медиа</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Краткое описание
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {initiative.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Relevance explanation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Почему релевантна
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {getRelevanceExplanation(
                        initiative.relevanceScore,
                        initiative.topic
                      )}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-3 flex-1 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            initiative.relevanceScore >= 80
                              ? "bg-blue-600"
                              : initiative.relevanceScore >= 60
                                ? "bg-blue-400"
                                : "bg-blue-300"
                          )}
                          style={{ width: `${initiative.relevanceScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {initiative.relevanceScore}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Хронология изменений
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0">
                      {initiative.versions
                        .slice()
                        .reverse()
                        .map((version: any, idx: number) => (
                          <div key={version.version} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full border-2 mt-1.5",
                                  idx === 0
                                    ? "bg-blue-600 border-blue-600"
                                    : "bg-white border-gray-300"
                                )}
                              />
                              {idx <
                                initiative.versions.length - 1 && (
                                <div className="w-px flex-1 bg-gray-200 my-1" />
                              )}
                            </div>
                            <div className="pb-6">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  Версия {version.version}
                                </span>
                                {idx === 0 && (
                                  <Badge variant="blue">Последняя</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(version.date)}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                {version.changes}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Ключевые даты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Последнее обновление
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatDate(initiative.lastUpdated)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дедлайн
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {initiative.deadline
                            ? formatDate(initiative.deadline)
                            : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Changes Tab */}
            <TabsContent value="changes">
              <Card>
                <CardHeader>
                  <CardTitle>История версий</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {initiative.versions
                      .slice()
                      .reverse()
                      .map((version: any, idx: number) => (
                        <div
                          key={version.version}
                          className={cn(
                            "rounded-lg border p-4 transition-colors",
                            idx === 0
                              ? "border-blue-200 bg-blue-50/50"
                              : "border-gray-200 bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                Версия {version.version}
                              </span>
                              {idx === 0 && (
                                <Badge variant="blue">Актуальная</Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(version.date)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">
                            {version.changes}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact">
              <div className="space-y-6">
                {/* Risk level */}
                <Card
                  className={cn(
                    "border-l-4",
                    initiative.risk === "high"
                      ? "border-l-red-500"
                      : initiative.risk === "medium"
                        ? "border-l-amber-500"
                        : "border-l-green-500"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Уровень риска: {riskLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {getRiskExplanation(initiative.risk, initiative.title)}
                    </p>
                  </CardContent>
                </Card>

                {/* Economic impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Оценка экономического влияния
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-gray-50 p-6 text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Оценочный диапазон финансового влияния
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatRubles(
                          getEconomicImpact(
                            initiative.risk,
                            initiative.relevanceScore
                          )
                        )}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        * Предварительная оценка на основе анализа рисков и
                        релевантности
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Affected areas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      Затронутые области
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {getImpactAreas(initiative.topic).map(
                        (area: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {area}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Stakeholders Tab */}
            <TabsContent value="stakeholders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Связанные стейкхолдеры
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stakeholders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Нет связанных стейкхолдеров
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {stakeholders.map((stakeholder: any) => {
                        const positionInfo =
                          POSITION_MAP[stakeholder.position] || {
                            label: stakeholder.position,
                            variant: "default" as const,
                          };
                        const influenceStars =
                          stakeholder.influence === "high"
                            ? 3
                            : stakeholder.influence === "medium"
                              ? 2
                              : 1;

                        return (
                          <div
                            key={stakeholder.id}
                            className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 transition-colors"
                            onClick={() =>
                              router.push(
                                `/app/stakeholders/${stakeholder.id}`
                              )
                            }
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {stakeholder.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {stakeholder.organization} &middot;{" "}
                                {stakeholder.role}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <Badge variant={positionInfo.variant}>
                                  {positionInfo.label}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(3)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        i < influenceStars
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-gray-300"
                                      )}
                                    />
                                  ))}
                                  <span className="ml-1 text-xs text-gray-500">
                                    Влияние
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-blue-600" />
                    Упоминания в СМИ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!initiative.mediaMentions ||
                  initiative.mediaMentions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Нет упоминаний в СМИ
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {initiative.mediaMentions.map(
                        (mention: any, idx: number) => {
                          const sentimentInfo =
                            SENTIMENT_MAP[mention.sentiment] || {
                              label: mention.sentiment,
                              variant: "default" as const,
                            };

                          return (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-4 py-4"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {mention.title}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {mention.source}
                                  </span>
                                  <span className="text-gray-300">
                                    &middot;
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(mention.date)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={sentimentInfo.variant}>
                                {sentimentInfo.label}
                              </Badge>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Track toggle */}
                <Button
                  variant={isTracking ? "secondary" : "default"}
                  className="w-full justify-start"
                  onClick={handleTrackToggle}
                >
                  {isTracking ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      Отслеживается
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      Отслеживать
                    </>
                  )}
                </Button>

                {/* Document generation buttons */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Генерация документов
                  </p>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                    onClick={() => openTemplateWizard("analytical_note")}
                    disabled={!canCreate}
                    title={
                      !canCreate
                        ? "Недостаточно прав для создания документов"
                        : undefined
                    }
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Аналитическая записка</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                    onClick={() => openTemplateWizard("legislative_amendment")}
                    disabled={!canCreate}
                    title={
                      !canCreate
                        ? "Недостаточно прав для создания документов"
                        : undefined
                    }
                  >
                    <Edit3 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Предложение поправок</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                    onClick={() => openTemplateWizard("official_letter")}
                    disabled={!canCreate}
                    title={
                      !canCreate
                        ? "Недостаточно прав для создания документов"
                        : undefined
                    }
                  >
                    <Send className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Официальное письмо</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    size="sm"
                    onClick={() => openTemplateWizard("presentation")}
                    disabled={!canCreate}
                    title={
                      !canCreate
                        ? "Недостаточно прав для создания документов"
                        : undefined
                    }
                  >
                    <Presentation className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Презентация</span>
                  </Button>
                </div>

                {/* Recommended actions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рекомендуемые действия
                  </p>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsDropdown(!showActionsDropdown);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Выбрать действие</span>
                    </Button>

                    {showActionsDropdown && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                        <div className="py-1">
                          {[
                            "Провести встречу с регулятором",
                            "Подготовить аналитическую записку",
                            "Инициировать внутреннее обсуждение",
                          ].map((action) => (
                            <button
                              key={action}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                toast.success("Действие запланировано", {
                                  description: action,
                                });
                                setShowActionsDropdown(false);
                              }}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Create task */}
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    size="sm"
                    onClick={handleCreateTask}
                    disabled={!canCreate}
                    title={
                      !canCreate
                        ? "Недостаточно прав для создания задач"
                        : undefined
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Создать задачу
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Информация</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500">Тема</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {initiative.topic}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Источник</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {initiative.source}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Регион</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {initiative.region}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Версий</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {initiative.versions.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Стейкхолдеров</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {stakeholders.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Упоминаний в СМИ</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {initiative.mediaMentions?.length || 0}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template Wizard */}
      <TemplateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preselectedTemplate={selectedTemplate}
        initiativeId={id}
        companyId={initiative?.companyIds?.[0]}
        entryPoint="initiative"
      />
    </div>
  );
}
