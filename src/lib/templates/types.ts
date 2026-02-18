import type { Company, Initiative, Stakeholder, User, Addressee, TemplateType } from '@/lib/types';

export interface TemplateSectionSchema {
  key: string;
  title: string;
  required: boolean;
  generate: (context: TemplateContext) => string;
}

export interface TemplateSchema {
  id: TemplateType;
  name: string;
  description: string;
  icon: string; // lucide icon name
  sections: TemplateSectionSchema[];
  requiresAddressee: boolean;
  requiresInitiative: boolean;
  requiresPeriod: boolean;
  exportFormats: ('pdf' | 'pptx')[];
  availableFrom: ('initiative' | 'document' | 'report')[];
}

export interface TemplateContext {
  company: Company;
  initiative?: Initiative;
  stakeholders: Stakeholder[];
  allInitiatives?: Initiative[];
  addressee?: Addressee;
  currentUser: User;
  currentDate: string;
  period?: string;
  // Template-specific config
  config?: Record<string, unknown>;
}

export interface GeneratedSection {
  title: string;
  text: string;
}
