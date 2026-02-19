// ── Template Types ──────────────────────────────────────────────────────────

export type TemplateType = 'analytical_note' | 'legislative_amendment' | 'official_letter' | 'gr_report' | 'presentation';

export interface Addressee {
  name: string;
  title: string;
  organization: string;
  address?: string;
}

export interface ExportRecord {
  format: string;
  date: string;
  filename: string;
}

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  analytical_note: 'Аналитическая записка',
  legislative_amendment: 'Предложение по изменению законодательства',
  official_letter: 'Официальное письмо',
  gr_report: 'Отчёт о GR-деятельности',
  presentation: 'Презентация',
};

// ── Role Types ──────────────────────────────────────────────────────────────

export type UserRole = 'gr_manager' | 'lawyer' | 'executive' | 'consultant' | 'admin';

export type RoleName = UserRole;

// ── Core Entities ───────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  inn: string;
  industry: string;
  region: string;
  employees: number;
  grCenterName?: string;
  execName?: string;
  execTitle?: string;
  outgoingLetterNumberCounter?: number;
  keyTopics?: string[];
  logo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  avatar: string | null;
}

// ── Initiative ──────────────────────────────────────────────────────────────

export interface Version {
  version: number;
  date: string;
  changes: string;
}

export interface MediaMention {
  title: string;
  source: string;
  date: string;
  sentiment: string;
}

export interface Initiative {
  id: string;
  title: string;
  summary: string;
  topic: string;
  region: string;
  status: string;
  risk: 'low' | 'medium' | 'high';
  relevanceScore: number;
  lastUpdated: string;
  deadline: string | null;
  source: string;
  versions: Version[];
  stakeholderIds: string[];
  mediaMentions: MediaMention[];
  companyIds: string[];
  domainArea?: string;
  riskJustification?: string;
  opportunities?: string[];
  estimatedEconomicImpact?: { min: number; max: number };
  fullTextLinks?: string[];
}

// ── Stakeholder ─────────────────────────────────────────────────────────────

export interface Interaction {
  id: string;
  type: string;
  date: string;
  summary: string;
  participants: string[];
  outcome: string;
  nextSteps: string;
  initiativeId?: string;
  documentId?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  organization: string;
  type: string;
  role: string;
  influence: string;
  position: string;
  topics: string[];
  contacts: {
    email: string | null;
    phone: string | null;
    assistant: string | null;
  };
  lastInteraction: string;
  interactions: Interaction[];
  contactAddress?: string;
}

// ── Document ────────────────────────────────────────────────────────────────

export interface DocumentSection {
  title: string;
  text: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  initiativeId: string | null;
  status: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  content: {
    sections: DocumentSection[];
  };
  relatedStakeholderIds: string[];
  companyId: string;
  templateType?: TemplateType;
  addressee?: Addressee;
  outgoingNumber?: string;
  exportHistory?: ExportRecord[];
}

// ── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  read: boolean;
  relatedId: string;
  relatedType: string;
  summary: string;
}

// ── Report Template ─────────────────────────────────────────────────────────

export interface ReportTemplate {
  id: string;
  name: string;
  period: string;
  sections: string[];
}

// ── Permissions ─────────────────────────────────────────────────────────────

export interface RolePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canExport: boolean;
  canManageStakeholders: boolean;
  canViewDashboard: boolean;
  canViewReports: boolean;
  canSwitchWorkspace: boolean;
  canEditSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  gr_manager: {
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canExport: true,
    canManageStakeholders: true,
    canViewDashboard: true,
    canViewReports: true,
    canSwitchWorkspace: false,
    canEditSettings: true,
  },
  lawyer: {
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canExport: true,
    canManageStakeholders: false,
    canViewDashboard: false,
    canViewReports: true,
    canSwitchWorkspace: false,
    canEditSettings: false,
  },
  executive: {
    canCreate: false,
    canEdit: false,
    canApprove: false,
    canExport: true,
    canManageStakeholders: false,
    canViewDashboard: true,
    canViewReports: true,
    canSwitchWorkspace: false,
    canEditSettings: false,
  },
  consultant: {
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canExport: true,
    canManageStakeholders: true,
    canViewDashboard: true,
    canViewReports: true,
    canSwitchWorkspace: true,
    canEditSettings: true,
  },
  admin: {
    canCreate: true,
    canEdit: true,
    canApprove: true,
    canExport: true,
    canManageStakeholders: true,
    canViewDashboard: true,
    canViewReports: true,
    canSwitchWorkspace: true,
    canEditSettings: true,
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  gr_manager: 'GR Менеджер',
  lawyer: 'Юрист/Комплаенс',
  executive: 'Руководитель',
  consultant: 'Консультант',
  admin: 'Администратор',
};

// ── Monitoring Settings ─────────────────────────────────────────────────────

export interface MonitoringSettings {
  topics: string[];
  regions: string[];
  sources: string[];
  riskThreshold: 'low' | 'medium' | 'high';
  emailNotifications: boolean;
  telegramNotifications: boolean;
  autoReportFrequency: 'daily' | 'weekly' | 'monthly';
}

// ── Parser Types ────────────────────────────────────────────────────────────
export interface ParserAuthConfig {
  type: 'none' | 'api_key' | 'oauth' | 'basic';
  credentials?: string;
}
export interface ParserDataMapping {
  titleSelector: string;
  summarySelector: string;
  dateSelector: string;
  statusMapping: string;
  topicRules: string;
  regionRules: string;
}
export interface ParserDeduplication {
  enabled: boolean;
  strategy: 'title_similarity' | 'url' | 'hash';
}

export interface Parser {
  id: string;
  name: string;
  sourceType: 'rss' | 'html_scraper' | 'api_endpoint' | 'telegram' | 'custom';
  sourceUrl: string;
  schedule: string;
  authConfig: ParserAuthConfig;
  dataMapping: ParserDataMapping;
  riskAssessment: boolean;
  deduplication: ParserDeduplication;
  targetCompanyIds: string[];
  enabled: boolean;
  status: 'running' | 'stopped' | 'error';
  lastRun: string | null;
  lastSuccess: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ParserRun {
  id: string;
  parserId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'success' | 'partial' | 'failed';
  recordsFound: number;
  recordsNew: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorMessage: string | null;
}

// ── Support Types ───────────────────────────────────────────────────────────
export type SupportCategory = 'bug_report' | 'feature_request' | 'question' | 'data_issue' | 'other';
export type SupportPriority = 'low' | 'medium' | 'high';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export interface SupportAttachment {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  companyId: string | null;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignedTo: string | null;
  pageContext: string;
  browserInfo: string;
  attachments: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}
export interface SupportMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorRole: 'user' | 'admin';
  text: string;
  isInternal: boolean;
  attachments: SupportAttachment[];
  createdAt: string;
}

// ── Audit Log ───────────────────────────────────────────────────────────────
export type AuditActionType =
  | 'user_created'
  | 'user_suspended'
  | 'company_created'
  | 'company_updated'
  | 'settings_changed'
  | 'parser_added'
  | 'parser_stopped'
  | 'parser_started'
  | 'llm_config_changed'
  | 'role_changed'
  | 'ticket_replied'
  | 'ticket_resolved';
export interface AuditLogEntry {
  id: string;
  adminUserId: string;
  actionType: AuditActionType;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

// ── System / LLM Config ────────────────────────────────────────────────────
export interface SystemSettings {
  platformName: string;
  language: 'ru' | 'en';
  dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  currency: 'RUB' | 'USD' | 'EUR';
  sessionTimeout: number;
  maxLoginAttempts: number;
  maintenanceMode: boolean;
  defaultTopics: string[];
  defaultRegions: string[];
  defaultSources: string[];
}
export interface LLMConfig {
  provider: 'openrouter' | 'custom';
  apiKey: string;
  customEndpoint?: string;
  primaryModel: string;
  fastModel: string;
  embeddingModel: string;
  masterPrompt: string;
  temperature: number;
  maxTokens: number;
  rateLimitPerUser: number;
  rateLimitGlobal: number;
  costAlertThreshold: number;
}
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  pricePerInputToken: number;
  pricePerOutputToken: number;
}
export interface LLMUsageLog {
  id: string;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  templateType: string | null;
  timestamp: string;
}

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  bug_report: 'Ошибка',
  feature_request: 'Предложение',
  question: 'Вопрос',
  data_issue: 'Проблема с данными',
  other: 'Другое',
};
export const SUPPORT_PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};
export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};
