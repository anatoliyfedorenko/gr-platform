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
} from '@/lib/types';

// ── Fixture imports ─────────────────────────────────────────────────────────

import fixtureUsers from '@/data/users.json';
import fixtureCompanies from '@/data/companies.json';
import fixtureInitiatives from '@/data/initiatives.json';
import fixtureStakeholders from '@/data/stakeholders.json';
import fixtureDocuments from '@/data/documents.json';
import fixtureNotifications from '@/data/notifications.json';

// ── Default settings ────────────────────────────────────────────────────────

const defaultSettings: MonitoringSettings = {
  topics: [
    'Регулирование OTT',
    'Цифровое неравенство',
    'Частотное регулирование',
    'Хранение данных',
    'Кибербезопасность',
    'Антимонопольное регулирование',
    'Налогообложение',
  ],
  regions: ['Федеральный', 'Москва', 'Санкт-Петербург', 'Новосибирская область'],
  sources: [
    'Государственная Дума',
    'Минцифры России',
    'Правительство РФ',
    'ФАС России',
    'ФСТЭК России',
    'Роскомнадзор',
  ],
  riskThreshold: 'medium',
  emailNotifications: true,
  telegramNotifications: false,
  autoReportFrequency: 'weekly',
};

// ── Store interface ─────────────────────────────────────────────────────────

interface AppState {
  // Data
  currentUser: User | null;
  currentRole: UserRole;
  currentCompanyId: string | null;
  companies: Company[];
  initiatives: Initiative[];
  stakeholders: Stakeholder[];
  documents: Document[];
  notifications: Notification[];
  settings: MonitoringSettings;
  isLoading: boolean;

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
}

// ── Store creation ──────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state — populated from fixtures
      currentUser: null,
      currentRole: 'gr_manager' as UserRole,
      currentCompanyId: null,
      companies: fixtureCompanies as unknown as Company[],
      initiatives: fixtureInitiatives as unknown as Initiative[],
      stakeholders: fixtureStakeholders as unknown as Stakeholder[],
      documents: fixtureDocuments as unknown as Document[],
      notifications: fixtureNotifications as unknown as Notification[],
      settings: defaultSettings,
      isLoading: false,

      // ── Actions ─────────────────────────────────────────────────────────

      login: (userId: string) => {
        const users = fixtureUsers as User[];
        const user = users.find((u) => u.id === userId) ?? null;
        if (user) {
          set({
            currentUser: user,
            currentRole: user.role,
            currentCompanyId: user.companyId,
          });
        }
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
          companies: fixtureCompanies as unknown as Company[],
          initiatives: fixtureInitiatives as unknown as Initiative[],
          stakeholders: fixtureStakeholders as unknown as Stakeholder[],
          documents: fixtureDocuments as unknown as Document[],
          notifications: fixtureNotifications as unknown as Notification[],
          settings: defaultSettings,
          isLoading: false,
        });
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
        companies: state.companies,
        notifications: state.notifications,
        documents: state.documents,
        stakeholders: state.stakeholders,
        settings: state.settings,
      }),
    }
  )
);
