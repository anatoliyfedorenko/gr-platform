import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  UserRole,
  Company,
  Initiative,
  Stakeholder,
  Document,
  Notification,
  Interaction,
  MonitoringSettings,
  Parser,
  ParserRun,
  SupportTicket,
  SupportMessage,
  AuditLogEntry,
  LLMUsageLog,
  SystemSettings,
  LLMConfig,
} from '@/lib/types';

// ── Fixture imports ─────────────────────────────────────────────────────────

import fixtureUsers from '@/data/users.json';
import fixtureCompanies from '@/data/companies.json';
import fixtureInitiatives from '@/data/initiatives.json';
import fixtureStakeholders from '@/data/stakeholders.json';
import fixtureDocuments from '@/data/documents.json';
import fixtureNotifications from '@/data/notifications.json';
import fixtureParsers from '@/data/parsers.json';
import fixtureParserRuns from '@/data/parser-runs.json';
import fixtureSupportTickets from '@/data/support-tickets.json';
import fixtureSupportMessages from '@/data/support-messages.json';
import fixtureAuditLog from '@/data/audit-log.json';
import fixtureLLMUsage from '@/data/llm-usage.json';

// ── Default settings ────────────────────────────────────────────────────────

const defaultSettings: MonitoringSettings = {
  topics: [
    'Регулирование ПВТ',
    'Цифровой кодекс',
    'Защита данных',
    'Налоговые преференции',
    'Кибербезопасность',
    'Электронная коммерция',
    'Телекоммуникации',
  ],
  regions: ['Республиканский', 'Бишкек', 'Чуйская область', 'Ошская область'],
  sources: [
    'Жогорку Кенеш',
    'Минцифры КР',
    'Кабинет Министров КР',
    'ПВТ КР',
    'Гос. агентство защиты данных',
    'СРРС',
  ],
  riskThreshold: 'medium',
  emailNotifications: true,
  telegramNotifications: false,
  autoReportFrequency: 'weekly',
};

const defaultSystemSettings: SystemSettings = {
  platformName: 'GR Intelligence Platform',
  language: 'ru',
  dateFormat: 'DD.MM.YYYY',
  currency: 'KGS',
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  maintenanceMode: false,
  defaultTopics: ['Регулирование ПВТ', 'Цифровой кодекс', 'Защита данных'],
  defaultRegions: ['Республиканский', 'Бишкек'],
  defaultSources: ['Жогорку Кенеш', 'Минцифры КР'],
};

const defaultLLMConfig: LLMConfig = {
  provider: 'openrouter',
  apiKey: 'sk-or-v1-****',
  primaryModel: 'anthropic/claude-sonnet-4-5-20250929',
  fastModel: 'anthropic/claude-haiku-4-5-20251001',
  embeddingModel: 'openai/text-embedding-3-small',
  masterPrompt:
    'Вы — эксперт по Government Relations и анализу регуляторной среды в Кыргызской Республике, с фокусом на IT-сектор и Парк высоких технологий (ПВТ). Ваша задача — помогать GR-специалистам анализировать законодательные инициативы, оценивать регуляторные риски и формировать аналитические документы. При ответах опирайтесь на актуальную нормативно-правовую базу КР (Закон о ПВТ, Цифровой кодекс, Закон о персональной информации), учитывайте специфику IT-компаний — резидентов ПВТ и предоставляйте структурированные, обоснованные выводы с указанием конкретных правовых норм.',
  temperature: 0.3,
  maxTokens: 4096,
  rateLimitPerUser: 20,
  rateLimitGlobal: 200,
  costAlertThreshold: 100,
};

// ── Store interface ─────────────────────────────────────────────────────────

interface AppState {
  // Data
  currentUser: User | null;
  currentRole: UserRole;
  currentCompanyId: string | null;
  users: User[];
  companies: Company[];
  initiatives: Initiative[];
  stakeholders: Stakeholder[];
  documents: Document[];
  notifications: Notification[];
  settings: MonitoringSettings;
  isLoading: boolean;

  // Admin data
  parsers: Parser[];
  parserRuns: ParserRun[];
  supportTickets: SupportTicket[];
  supportMessages: SupportMessage[];
  auditLog: AuditLogEntry[];
  llmUsage: LLMUsageLog[];
  systemSettings: SystemSettings;
  llmConfig: LLMConfig;

  // Actions
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setCompany: (companyId: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  addInteraction: (stakeholderId: string, interaction: Interaction) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (settings: Partial<MonitoringSettings>) => void;
  resetDemoData: () => void;

  // Admin actions
  addParser: (parser: Parser) => void;
  updateParser: (id: string, updates: Partial<Parser>) => void;
  deleteParser: (id: string) => void;
  addSupportTicket: (ticket: SupportTicket) => void;
  updateSupportTicket: (id: string, updates: Partial<SupportTicket>) => void;
  addSupportMessage: (message: SupportMessage) => void;
  addAuditLogEntry: (entry: AuditLogEntry) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  addCompany: (company: Company) => void;
  addUser: (user: User) => void;
}

// ── Store creation ──────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state — populated from fixtures
      currentUser: null,
      currentRole: 'gr_manager' as UserRole,
      currentCompanyId: null,
      users: fixtureUsers as unknown as User[],
      companies: fixtureCompanies as unknown as Company[],
      initiatives: fixtureInitiatives as unknown as Initiative[],
      stakeholders: fixtureStakeholders as unknown as Stakeholder[],
      documents: fixtureDocuments as unknown as Document[],
      notifications: fixtureNotifications as unknown as Notification[],
      settings: defaultSettings,
      isLoading: false,

      // Admin initial state
      parsers: fixtureParsers as unknown as Parser[],
      parserRuns: fixtureParserRuns as unknown as ParserRun[],
      supportTickets: fixtureSupportTickets as unknown as SupportTicket[],
      supportMessages: fixtureSupportMessages as unknown as SupportMessage[],
      auditLog: fixtureAuditLog as unknown as AuditLogEntry[],
      llmUsage: fixtureLLMUsage as unknown as LLMUsageLog[],
      systemSettings: defaultSystemSettings,
      llmConfig: defaultLLMConfig,

      // ── Actions ─────────────────────────────────────────────────────────

      login: (userId: string) => {
        set((state) => {
          const user = state.users.find((u) => u.id === userId) ?? null;
          if (user) {
            return {
              currentUser: user,
              currentRole: user.role,
              currentCompanyId: user.companyId,
            };
          }
          return {};
        });
      },

      logout: () => {
        set({
          currentUser: null,
          currentRole: 'gr_manager' as UserRole,
          currentCompanyId: null,
        });
      },

      switchRole: (role: UserRole) => {
        set({ currentRole: role });
      },

      setCompany: (companyId: string) => {
        set({ currentCompanyId: companyId });
      },

      updateCompany: (id: string, updates: Partial<Company>) => {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      addDocument: (doc: Document) => {
        set((state) => ({
          documents: [...state.documents, doc],
        }));
      },

      updateDocument: (id: string, updates: Partial<Document>) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      addInteraction: (stakeholderId: string, interaction: Interaction) => {
        set((state) => ({
          stakeholders: state.stakeholders.map((s) =>
            s.id === stakeholderId
              ? {
                  ...s,
                  interactions: [...s.interactions, interaction],
                  lastInteraction: interaction.date,
                }
              : s
          ),
        }));
      },

      markNotificationRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      updateSettings: (newSettings: Partial<MonitoringSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetDemoData: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gr-platform-storage');
        }
        set({
          currentUser: null,
          currentRole: 'gr_manager' as UserRole,
          currentCompanyId: null,
          users: fixtureUsers as unknown as User[],
          companies: fixtureCompanies as unknown as Company[],
          initiatives: fixtureInitiatives as unknown as Initiative[],
          stakeholders: fixtureStakeholders as unknown as Stakeholder[],
          documents: fixtureDocuments as unknown as Document[],
          notifications: fixtureNotifications as unknown as Notification[],
          settings: defaultSettings,
          isLoading: false,
          parsers: fixtureParsers as unknown as Parser[],
          parserRuns: fixtureParserRuns as unknown as ParserRun[],
          supportTickets: fixtureSupportTickets as unknown as SupportTicket[],
          supportMessages: fixtureSupportMessages as unknown as SupportMessage[],
          auditLog: fixtureAuditLog as unknown as AuditLogEntry[],
          llmUsage: fixtureLLMUsage as unknown as LLMUsageLog[],
          systemSettings: defaultSystemSettings,
          llmConfig: defaultLLMConfig,
        });
      },

      // ── Admin Actions ─────────────────────────────────────────────────

      addParser: (parser: Parser) => {
        set((state) => ({
          parsers: [...state.parsers, parser],
        }));
      },

      updateParser: (id: string, updates: Partial<Parser>) => {
        set((state) => ({
          parsers: state.parsers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteParser: (id: string) => {
        set((state) => ({
          parsers: state.parsers.filter((p) => p.id !== id),
        }));
      },

      addSupportTicket: (ticket: SupportTicket) => {
        set((state) => ({
          supportTickets: [...state.supportTickets, ticket],
        }));
      },

      updateSupportTicket: (id: string, updates: Partial<SupportTicket>) => {
        set((state) => ({
          supportTickets: state.supportTickets.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      addSupportMessage: (message: SupportMessage) => {
        set((state) => ({
          supportMessages: [...state.supportMessages, message],
        }));
      },

      addAuditLogEntry: (entry: AuditLogEntry) => {
        set((state) => ({
          auditLog: [entry, ...state.auditLog],
        }));
      },

      updateSystemSettings: (settings: Partial<SystemSettings>) => {
        set((state) => ({
          systemSettings: { ...state.systemSettings, ...settings },
        }));
      },

      updateLLMConfig: (config: Partial<LLMConfig>) => {
        set((state) => ({
          llmConfig: { ...state.llmConfig, ...config },
        }));
      },

      addCompany: (company: Company) => {
        set((state) => ({
          companies: [...state.companies, company],
        }));
      },

      addUser: (user: User) => {
        set((state) => ({
          users: [...state.users, user],
        }));
      },
    }),
    {
      name: 'gr-platform-storage',
      storage: createJSONStorage(() => {
        // SSR-safe: return a no-op storage when window is not available
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // Only persist user-mutable state — fixture data reloads from imports
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        currentCompanyId: state.currentCompanyId,
        users: state.users,
        companies: state.companies,
        notifications: state.notifications,
        documents: state.documents,
        stakeholders: state.stakeholders,
        settings: state.settings,
        parsers: state.parsers,
        parserRuns: state.parserRuns,
        supportTickets: state.supportTickets,
        supportMessages: state.supportMessages,
        auditLog: state.auditLog,
        llmUsage: state.llmUsage,
        systemSettings: state.systemSettings,
        llmConfig: state.llmConfig,
      }),
    }
  )
);
