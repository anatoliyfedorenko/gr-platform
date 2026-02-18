import type { TemplateSchema, TemplateContext, GeneratedSection } from './types';

export function generateFromTemplate(
  schema: TemplateSchema,
  context: TemplateContext
): GeneratedSection[] {
  return schema.sections.map((section) => ({
    title: section.title,
    text: section.generate(context),
  }));
}
