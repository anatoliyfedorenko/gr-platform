import type { TemplateSchema } from './types';
import type { TemplateType } from '@/lib/types';
import { analyticalNoteTemplate } from './definitions/analytical-note';
import { legislativeAmendmentTemplate } from './definitions/legislative-amendment';
import { officialLetterTemplate } from './definitions/official-letter';
import { grReportTemplate } from './definitions/gr-report';
import { presentationTemplate } from './definitions/presentation';

export const TEMPLATE_REGISTRY: Record<TemplateType, TemplateSchema> = {
  analytical_note: analyticalNoteTemplate,
  legislative_amendment: legislativeAmendmentTemplate,
  official_letter: officialLetterTemplate,
  gr_report: grReportTemplate,
  presentation: presentationTemplate,
};

export function getTemplateSchema(type: TemplateType): TemplateSchema {
  return TEMPLATE_REGISTRY[type];
}

export function getAvailableTemplates(context: 'initiative' | 'document' | 'report'): TemplateSchema[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.availableFrom.includes(context));
}
