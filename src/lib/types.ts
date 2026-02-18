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

export type UserRole = 'gr_manager' | 'lawyer' | 'executive' | 'consultant';

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
};

export const ROLE_LABELS: Record<UserRole, string> = {
  gr_manager: 'GR Менеджер',
  lawyer: 'Юрист/Комплаенс',
  executive: 'Руководитель',
  consultant: 'Консультант',
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
