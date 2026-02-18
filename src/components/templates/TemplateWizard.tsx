'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  Scale,
  Mail,
  BarChart3,
  Presentation,
  Check,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SlidePreview } from '@/components/templates/SlidePreview';
import { useStore } from '@/store/useStore';
import { generateFromTemplate } from '@/lib/templates/engine';
import { getTemplateSchema, getAvailableTemplates } from '@/lib/templates/registry';
import type { TemplateType, Addressee, Document } from '@/lib/types';
import type { TemplateSchema, GeneratedSection, TemplateContext } from '@/lib/templates/types';
import type { Company } from '@/lib/types';
import companiesData from '@/data/companies.json';

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Шаблон', 'Параметры', 'Редактирование', 'Сохранение'] as const;

const TEMPLATE_ICONS: Record<TemplateType, React.FC<{ className?: string }>> = {
  analytical_note: FileText,
  legislative_amendment: Scale,
  official_letter: Mail,
  gr_report: BarChart3,
  presentation: Presentation,
};

const TEMPLATE_TYPE_MAP: Record<TemplateType, string> = {
  analytical_note: 'analysis',
  legislative_amendment: 'proposal',
  official_letter: 'letter',
  gr_report: 'analysis',
  presentation: 'analysis',
};

const PERIOD_MONTHS = (() => {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return months;
})();

const PERIOD_QUARTERS = (() => {
  const quarters: { value: string; label: string }[] = [];
  const now = new Date();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  let year = now.getFullYear();
  let q = currentQ;
  for (let i = 0; i < 4; i++) {
    quarters.push({
      value: `Q${q}-${year}`,
      label: `${q}-й квартал ${year}`,
    });
    q--;
    if (q === 0) {
      q = 4;
      year--;
    }
  }
  return quarters;
})();

// ── Letter request type options ──────────────────────────────────────────────

const LETTER_TYPE_OPTIONS = [
  { value: 'clarification', label: 'Запрос разъяснений' },
  { value: 'position', label: 'Выражение позиции' },
  { value: 'proposal', label: 'Предложение' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface TemplateWizardProps {
  open: boolean;
  onClose: () => void;
  preselectedTemplate?: TemplateType;
  initiativeId?: string;
  companyId?: string;
  entryPoint?: 'initiative' | 'document' | 'report';
}

// ── Component ────────────────────────────────────────────────────────────────

const TemplateWizard: React.FC<TemplateWizardProps> = ({
  open,
  onClose,
  preselectedTemplate,
  initiativeId,
  companyId,
  entryPoint = 'document',
}) => {
  const router = useRouter();
  const { initiatives, stakeholders, currentUser } = useStore();
  const companies = companiesData as Company[];

  // ── State ────────────────────────────────────────────────────────────────

  const [step, setStep] = React.useState(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateType | null>(
    preselectedTemplate ?? null
  );
  const [selectedInitiativeId, setSelectedInitiativeId] = React.useState(initiativeId ?? '');
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(companyId ?? '');
  const [addressee, setAddressee] = React.useState<Addressee | null>(null);
  const [config, setConfig] = React.useState<Record<string, unknown>>({});
  const [generatedSections, setGeneratedSections] = React.useState<GeneratedSection[]>([]);
  const [originalSections, setOriginalSections] = React.useState<GeneratedSection[]>([]);
  const [periodType, setPeriodType] = React.useState<'month' | 'quarter'>('month');
  const [selectedPeriod, setSelectedPeriod] = React.useState('');

  // ── Derived data ─────────────────────────────────────────────────────────

  const availableTemplates = React.useMemo(
    () => getAvailableTemplates(entryPoint),
    [entryPoint]
  );

  const templateSchema: TemplateSchema | null = React.useMemo(
    () => (selectedTemplate ? getTemplateSchema(selectedTemplate) : null),
    [selectedTemplate]
  );

  const selectedInitiative = React.useMemo(
    () => initiatives.find((i) => i.id === selectedInitiativeId) ?? null,
    [initiatives, selectedInitiativeId]
  );

  const selectedCompany = React.useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const initiativeStakeholders = React.useMemo(() => {
    if (!selectedInitiative) return [];
    return stakeholders.filter((s) =>
      selectedInitiative.stakeholderIds.includes(s.id)
    );
  }, [selectedInitiative, stakeholders]);

  // ── Auto-fill defaults on template/initiative change ──────────────────

  React.useEffect(() => {
    if (!selectedTemplate) return;

    // Initialize config with defaults for the template
    const defaults: Record<string, unknown> = {};

    if (selectedTemplate === 'analytical_note') {
      defaults.sectionToggles = {
        risks: true,
        opportunities: true,
        economicImpact: true,
        stakeholders: true,
        recommendations: true,
        attachments: true,
      };
      if (selectedInitiative) {
        defaults.domainArea = selectedInitiative.domainArea ?? selectedInitiative.topic ?? '';
      }
    }

    if (selectedTemplate === 'legislative_amendment') {
      defaults.includeInternational = true;
      defaults.targetAct = '';
      defaults.changeGoal = '';
    }

    if (selectedTemplate === 'official_letter') {
      defaults.letterType = 'clarification';
    }

    if (selectedTemplate === 'gr_report') {
      defaults.kpiToggles = {
        monitoring: true,
        risks: true,
        stakeholders: true,
        media: true,
        financialImpact: true,
      };
    }

    if (selectedTemplate === 'presentation') {
      defaults.presentationTitle = 'Обзор регуляторной среды телекоммуникаций';
      defaults.includeCharts = true;
    }

    setConfig((prev) => ({ ...defaults, ...prev }));
  }, [selectedTemplate, selectedInitiative]);

  // ── Auto-advance past step 1 when template is preselected ─────────────

  React.useEffect(() => {
    if (preselectedTemplate && step === 1 && open) {
      setSelectedTemplate(preselectedTemplate);
      setStep(2);
    }
  }, [preselectedTemplate, open, step]);

  // ── Default company from currentUser ──────────────────────────────────

  React.useEffect(() => {
    if (!selectedCompanyId && currentUser?.companyId) {
      setSelectedCompanyId(currentUser.companyId);
    }
  }, [currentUser, selectedCompanyId]);

  // ── Default period ────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!selectedPeriod) {
      if (periodType === 'month' && PERIOD_MONTHS.length > 0) {
        setSelectedPeriod(PERIOD_MONTHS[0].value);
      } else if (periodType === 'quarter' && PERIOD_QUARTERS.length > 0) {
        setSelectedPeriod(PERIOD_QUARTERS[0].value);
      }
    }
  }, [periodType, selectedPeriod]);

  // ── Generate outgoing number for official_letter ──────────────────────

  const outgoingNumber = React.useMemo(() => {
    if (selectedTemplate !== 'official_letter' || !selectedCompany) return '';
    const words = selectedCompany.name.split(/\s+/).filter(Boolean);
    const abbreviation = words.map((w) => w[0].toUpperCase()).join('');
    const counter = selectedCompany.outgoingLetterNumberCounter ?? 1;
    const year = new Date().getFullYear();
    return `${abbreviation}-${counter}/${year}`;
  }, [selectedTemplate, selectedCompany]);

  // ── Generate sections when entering step 3 ────────────────────────────

  const generateSections = React.useCallback(() => {
    if (!templateSchema || !selectedCompany || !currentUser) return;

    const context: TemplateContext = {
      company: selectedCompany,
      initiative: selectedInitiative ?? undefined,
      stakeholders: initiativeStakeholders,
      allInitiatives: initiatives,
      addressee: addressee ?? undefined,
      currentUser,
      currentDate: new Date().toISOString().split('T')[0],
      period: selectedPeriod,
      config,
    };

    const sections = generateFromTemplate(templateSchema, context);
    setGeneratedSections(sections);
    setOriginalSections(sections.map((s) => ({ ...s })));
  }, [
    templateSchema,
    selectedCompany,
    selectedInitiative,
    initiativeStakeholders,
    initiatives,
    addressee,
    currentUser,
    selectedPeriod,
    config,
  ]);

  // ── Navigation validation ─────────────────────────────────────────────

  const canAdvance = React.useMemo(() => {
    if (step === 1) {
      return selectedTemplate !== null;
    }
    if (step === 2) {
      if (!selectedCompanyId) return false;
      if (templateSchema?.requiresInitiative && !selectedInitiativeId && !initiativeId) {
        return false;
      }
      if (selectedTemplate === 'official_letter' && !addressee) {
        return false;
      }
      return true;
    }
    if (step === 3) {
      return generatedSections.length > 0;
    }
    return true;
  }, [
    step,
    selectedTemplate,
    selectedCompanyId,
    selectedInitiativeId,
    initiativeId,
    templateSchema,
    addressee,
    generatedSections,
  ]);

  // ── Step navigation handlers ──────────────────────────────────────────

  const handleNext = () => {
    if (step === 2) {
      generateSections();
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    if (step === 1) {
      onClose();
      return;
    }
    // If preselected, skip step 1 when going back
    if (step === 2 && preselectedTemplate) {
      onClose();
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  // ── Section editing ───────────────────────────────────────────────────

  const handleSectionEdit = (index: number, text: string) => {
    setGeneratedSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text } : s))
    );
  };

  const handleSlideEdit = (index: number, field: 'title' | 'text', value: string) => {
    setGeneratedSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleResetSection = (index: number) => {
    if (originalSections[index]) {
      setGeneratedSections((prev) =>
        prev.map((s, i) => (i === index ? { ...originalSections[i] } : s))
      );
    }
  };

  // ── Save handler ──────────────────────────────────────────────────────

  const handleSave = () => {
    if (!selectedTemplate || !currentUser || !selectedCompanyId) return;

    const templateLabel =
      templateSchema?.name ?? selectedTemplate;
    const initiativeTitle = selectedInitiative?.title ?? '';
    const docTitle = initiativeTitle
      ? `${templateLabel}: ${initiativeTitle}`
      : templateLabel;

    const now = new Date().toISOString().split('T')[0];
    const docId = `doc-${Date.now()}`;

    const relatedStakeholderIds: string[] = [];
    if (selectedInitiative) {
      relatedStakeholderIds.push(...selectedInitiative.stakeholderIds);
    }
    if (addressee) {
      const matchedStakeholder = stakeholders.find(
        (s) => s.name === addressee.name
      );
      if (matchedStakeholder && !relatedStakeholderIds.includes(matchedStakeholder.id)) {
        relatedStakeholderIds.push(matchedStakeholder.id);
      }
    }

    const doc: Document = {
      id: docId,
      title: docTitle,
      type: TEMPLATE_TYPE_MAP[selectedTemplate],
      templateType: selectedTemplate,
      initiativeId: selectedInitiativeId || null,
      status: 'draft',
      owner: currentUser.id,
      createdAt: now,
      updatedAt: now,
      content: {
        sections: generatedSections.map((s) => ({
          title: s.title,
          text: s.text,
        })),
      },
      relatedStakeholderIds,
      companyId: selectedCompanyId,
      addressee: addressee ?? undefined,
      outgoingNumber:
        selectedTemplate === 'official_letter' ? outgoingNumber : undefined,
      exportHistory: [],
    };

    useStore.getState().addDocument(doc);
    toast.success('Документ создан');
    onClose();
    router.push(`/app/documents/${docId}`);
  };

  // ── Reset state when modal closes/opens ───────────────────────────────

  React.useEffect(() => {
    if (!open) {
      // Reset on close after a short delay to allow animation
      const timeout = setTimeout(() => {
        setStep(preselectedTemplate ? 2 : 1);
        setSelectedTemplate(preselectedTemplate ?? null);
        setSelectedInitiativeId(initiativeId ?? '');
        setSelectedCompanyId(companyId ?? currentUser?.companyId ?? '');
        setAddressee(null);
        setConfig({});
        setGeneratedSections([]);
        setOriginalSections([]);
        setPeriodType('month');
        setSelectedPeriod('');
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open, preselectedTemplate, initiativeId, companyId, currentUser]);

  // ── Render: Step Indicator ────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6 px-4">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;

        return (
          <React.Fragment key={stepNum}>
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 flex-1 max-w-[60px] mx-1 sm:mx-2 transition-colors',
                  isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive || isCompleted ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Render: Step 1 — Choose Template ──────────────────────────────────

  const renderStep1 = () => (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Выберите тип документа для создания
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableTemplates.map((tmpl) => {
          const Icon = TEMPLATE_ICONS[tmpl.id] ?? FileText;
          const isSelected = selectedTemplate === tmpl.id;

          return (
            <Card
              key={tmpl.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-blue-300',
                isSelected && 'ring-2 ring-blue-500 border-blue-500'
              )}
              onClick={() => {
                setSelectedTemplate(tmpl.id);
                setStep(2);
              }}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg',
                        isSelected
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {tmpl.name}
                    </CardTitle>
                  </div>
                  <Badge variant="blue" className="ml-2 flex-shrink-0">
                    {tmpl.sections.length} {getSectionWord(tmpl.sections.length)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {tmpl.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ── Render: Step 2 — Configure Parameters ─────────────────────────────

  const renderStep2 = () => {
    if (!templateSchema) return null;

    return (
      <div className="space-y-5">
        {/* Common fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Общие параметры
          </h3>

          {/* Initiative selector */}
          {templateSchema.requiresInitiative && !initiativeId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Инициатива
              </label>
              <Select
                options={initiatives.map((i) => ({
                  value: i.id,
                  label: i.title,
                }))}
                value={selectedInitiativeId}
                onChange={setSelectedInitiativeId}
                placeholder="Выберите инициативу"
              />
            </div>
          )}

          {/* Company selector */}
          {!companyId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Компания
              </label>
              <Select
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={selectedCompanyId}
                onChange={setSelectedCompanyId}
                placeholder="Выберите компанию"
              />
            </div>
          )}
        </div>

        {/* Template-specific fields */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Параметры шаблона
          </h3>

          {selectedTemplate === 'analytical_note' && renderAnalyticalNoteConfig()}
          {selectedTemplate === 'legislative_amendment' && renderLegislativeAmendmentConfig()}
          {selectedTemplate === 'official_letter' && renderOfficialLetterConfig()}
          {selectedTemplate === 'gr_report' && renderGrReportConfig()}
          {selectedTemplate === 'presentation' && renderPresentationConfig()}
        </div>
      </div>
    );
  };

  // ── Template 1: Analytical Note config ────────────────────────────────

  const renderAnalyticalNoteConfig = () => {
    const domainArea = (config.domainArea as string) ?? '';
    const recipientName = (config.recipientName as string) ?? '';
    const toggles = (config.sectionToggles as Record<string, boolean>) ?? {
      risks: true,
      opportunities: true,
      economicImpact: true,
      stakeholders: true,
      recommendations: true,
      attachments: true,
    };

    const toggleLabels: Record<string, string> = {
      risks: 'Риски',
      opportunities: 'Возможности',
      economicImpact: 'Экономический эффект',
      stakeholders: 'Стейкхолдеры',
      recommendations: 'Рекомендации',
      attachments: 'Приложения',
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Область регулирования
          </label>
          <Input
            value={domainArea}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, domainArea: e.target.value }))
            }
            placeholder="Например: радиочастотный спектр"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Получатель (необязательно)
          </label>
          <Input
            value={recipientName}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, recipientName: e.target.value }))
            }
            placeholder="ФИО и должность"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Включить разделы
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(toggleLabels).map(([key, label]) => (
              <Switch
                key={key}
                label={label}
                checked={toggles[key] ?? true}
                onChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    sectionToggles: { ...toggles, [key]: checked },
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Template 2: Legislative Amendment config ──────────────────────────

  const renderLegislativeAmendmentConfig = () => {
    const targetAct = (config.targetAct as string) ?? '';
    const changeGoal = (config.changeGoal as string) ?? '';
    const includeInternational = (config.includeInternational as boolean) ?? true;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Целевой нормативный акт
          </label>
          <Input
            value={targetAct}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, targetAct: e.target.value }))
            }
            placeholder='Например: Федеральный закон "О связи"'
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цель изменения
          </label>
          <Input
            value={changeGoal}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, changeGoal: e.target.value }))
            }
            placeholder="Описание цели предлагаемых изменений"
          />
        </div>

        <Switch
          label="Включить международный опыт"
          checked={includeInternational}
          onChange={(checked) =>
            setConfig((prev) => ({ ...prev, includeInternational: checked }))
          }
        />
      </div>
    );
  };

  // ── Template 3: Official Letter config ────────────────────────────────

  const renderOfficialLetterConfig = () => {
    const letterType = (config.letterType as string) ?? 'clarification';

    const stakeholderOptions = initiativeStakeholders.length > 0
      ? initiativeStakeholders.map((s) => ({
          value: s.id,
          label: `${s.name} — ${s.organization}`,
        }))
      : stakeholders.map((s) => ({
          value: s.id,
          label: `${s.name} — ${s.organization}`,
        }));

    const selectedStakeholderId = (config.selectedStakeholderId as string) ?? '';

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Адресат
          </label>
          <Select
            options={stakeholderOptions}
            value={selectedStakeholderId}
            onChange={(value) => {
              setConfig((prev) => ({ ...prev, selectedStakeholderId: value }));
              const stk = stakeholders.find((s) => s.id === value);
              if (stk) {
                setAddressee({
                  name: stk.name,
                  title: stk.role,
                  organization: stk.organization,
                  address: stk.contactAddress,
                });
              }
            }}
            placeholder="Выберите адресата"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип обращения
          </label>
          <Select
            options={LETTER_TYPE_OPTIONS}
            value={letterType}
            onChange={(value) =>
              setConfig((prev) => ({ ...prev, letterType: value }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Исходящий номер
          </label>
          <Input value={outgoingNumber} readOnly disabled className="bg-gray-50" />
        </div>
      </div>
    );
  };

  // ── Template 4: GR Report config ──────────────────────────────────────

  const renderGrReportConfig = () => {
    const kpiToggles = (config.kpiToggles as Record<string, boolean>) ?? {
      monitoring: true,
      risks: true,
      stakeholders: true,
      media: true,
      financialImpact: true,
    };

    const kpiLabels: Record<string, string> = {
      monitoring: 'Мониторинг',
      risks: 'Риски',
      stakeholders: 'Стейкхолдеры',
      media: 'Медиа',
      financialImpact: 'Финансовый эффект',
    };

    return (
      <div className="space-y-4">
        {renderPeriodSelector()}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Блоки KPI
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(kpiLabels).map(([key, label]) => (
              <Switch
                key={key}
                label={label}
                checked={kpiToggles[key] ?? true}
                onChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    kpiToggles: { ...kpiToggles, [key]: checked },
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Template 5: Presentation config ───────────────────────────────────

  const renderPresentationConfig = () => {
    const presentationTitle =
      (config.presentationTitle as string) ??
      'Обзор регуляторной среды телекоммуникаций';
    const includeCharts = (config.includeCharts as boolean) ?? true;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название презентации
          </label>
          <Input
            value={presentationTitle}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                presentationTitle: e.target.value,
              }))
            }
            placeholder="Название презентации"
          />
        </div>

        {renderPeriodSelector()}

        <Switch
          label="Включить диаграммы"
          checked={includeCharts}
          onChange={(checked) =>
            setConfig((prev) => ({ ...prev, includeCharts: checked }))
          }
        />
      </div>
    );
  };

  // ── Shared period selector ────────────────────────────────────────────

  const renderPeriodSelector = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип периода
        </label>
        <div className="flex gap-2">
          <Button
            variant={periodType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setPeriodType('month');
              setSelectedPeriod(PERIOD_MONTHS[0]?.value ?? '');
            }}
          >
            Месяц
          </Button>
          <Button
            variant={periodType === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setPeriodType('quarter');
              setSelectedPeriod(PERIOD_QUARTERS[0]?.value ?? '');
            }}
          >
            Квартал
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Период
        </label>
        <Select
          options={periodType === 'month' ? PERIOD_MONTHS : PERIOD_QUARTERS}
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          placeholder="Выберите период"
        />
      </div>
    </div>
  );

  // ── Render: Step 3 — Preview & Edit ───────────────────────────────────

  const renderStep3 = () => {
    if (generatedSections.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Нет сгенерированных разделов.</p>
        </div>
      );
    }

    // Presentation mode
    if (selectedTemplate === 'presentation') {
      return (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Предварительный просмотр слайдов
          </h3>
          <SlidePreview
            slides={generatedSections}
            editable
            onEditSlide={handleSlideEdit}
          />
        </div>
      );
    }

    // Document mode (templates 1-4)
    return (
      <div className="flex gap-4">
        {/* Section navigation (left sidebar) */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <nav className="sticky top-0 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Разделы
            </p>
            {generatedSections.map((section, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`section-${index}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={cn(
                  'block w-full text-left text-xs px-2 py-1.5 rounded-md truncate',
                  'text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors'
                )}
                title={section.title}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="flex-1 space-y-4 min-w-0">
          {generatedSections.map((section, index) => (
            <Card key={index} id={`section-${index}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetSection(index)}
                    title="Восстановить"
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Восстановить</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <TextArea
                  value={section.text}
                  onChange={(e) => handleSectionEdit(index, e.target.value)}
                  rows={Math.max(6, Math.ceil(section.text.length / 100))}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ── Render: Step 4 — Save ─────────────────────────────────────────────

  const renderStep4 = () => {
    const templateLabel = templateSchema?.name ?? '';

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">Итоговая информация</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Тип документа</span>
                <Badge variant="blue">{templateLabel}</Badge>
              </div>

              {selectedInitiative && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Инициатива</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                    {selectedInitiative.title}
                  </span>
                </div>
              )}

              {selectedCompany && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Компания</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedCompany.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Количество разделов</span>
                <span className="text-sm font-medium text-gray-900">
                  {generatedSections.length}
                </span>
              </div>

              {addressee && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Адресат</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                    {addressee.name}, {addressee.organization}
                  </span>
                </div>
              )}

              {outgoingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Исходящий номер</span>
                  <span className="text-sm font-medium text-gray-900">
                    {outgoingNumber}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Дата создания</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(new Date().toISOString().split('T')[0])}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Статус</span>
                <Badge variant="yellow">Черновик</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Документ будет сохранён как черновик. Вы сможете продолжить редактирование
            на странице документа.
          </p>
        </div>
      </div>
    );
  };

  // ── Render: Navigation buttons ────────────────────────────────────────

  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
      <Button variant="outline" onClick={handleBack}>
        {step === 1 || (step === 2 && preselectedTemplate) ? 'Отмена' : 'Назад'}
      </Button>

      {step < 4 ? (
        <Button onClick={handleNext} disabled={!canAdvance}>
          Далее
        </Button>
      ) : (
        <Button onClick={handleSave}>Сохранить как черновик</Button>
      )}
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Создание документа"
      size="3xl"
    >
      {renderStepIndicator()}

      <div className="min-h-[300px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {renderNavigation()}
    </Modal>
  );
};
TemplateWizard.displayName = 'TemplateWizard';

// ── Helper ─────────────────────────────────────────────────────────────────

function getSectionWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'разделов';
  if (mod10 === 1) return 'раздел';
  if (mod10 >= 2 && mod10 <= 4) return 'раздела';
  return 'разделов';
}

export { TemplateWizard };
