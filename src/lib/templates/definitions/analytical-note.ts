import type { TemplateSchema, TemplateContext } from '../types';
import {
  formatDate,
  formatRiskLevel,
  formatStance,
  formatCurrencyRange,
  getRecommendations,
} from '../utils';

export const analyticalNoteTemplate: TemplateSchema = {
  id: 'analytical_note',
  name: 'Аналитическая записка',
  description:
    'Аналитическая записка (меморандум) о регуляторных изменениях с оценкой рисков, анализом воздействия и рекомендациями',
  icon: 'FileText',
  requiresAddressee: false,
  requiresInitiative: true,
  requiresPeriod: false,
  exportFormats: ['pdf'],
  availableFrom: ['initiative', 'document'],
  sections: [
    {
      key: 'header',
      title: 'Заголовок и реквизиты',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        const date = formatDate(ctx.currentDate);
        const recipient =
          ctx.addressee?.name ?? ctx.company.execName ?? 'Руководство компании';
        const grCenter = ctx.company.grCenterName ?? 'Центр по взаимодействию с органами государственной власти';
        const domainArea = initiative?.domainArea ?? initiative?.topic ?? 'отрасли';

        return (
          `Аналитическая записка о регуляторных изменениях в сфере ${domainArea}\n\n` +
          `Дата: ${date}\n` +
          `Для: ${recipient}\n` +
          `От: ${grCenter}\n` +
          `Тема: Обзор изменений в регулировании ${domainArea} и их потенциальное влияние на ${ctx.company.name}`
        );
      },
    },
    {
      key: 'summary',
      title: 'Резюме',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Информация об инициативе отсутствует.';

        const riskLabel = formatRiskLevel(initiative.risk);
        const deadline = initiative.deadline
          ? formatDate(initiative.deadline)
          : 'не установлен';

        return (
          `${initiative.summary} ` +
          `Уровень риска для компании оценивается как ${riskLabel.toLowerCase()}. ` +
          `Текущий статус инициативы: ${initiative.status}. ` +
          `Ключевой срок: ${deadline}. ` +
          `Данная записка содержит анализ потенциального воздействия и рекомендации по реагированию.`
        );
      },
    },
    {
      key: 'description',
      title: '1. Описание регуляторного изменения',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Описание недоступно.';

        const source = initiative.source ?? 'источник не указан';
        const lastUpdated = initiative.lastUpdated
          ? formatDate(initiative.lastUpdated)
          : 'дата не указана';
        const domainArea = initiative.domainArea ?? initiative.topic ?? 'нормативного регулирования';

        let text =
          `Инициатива «${initiative.title}» относится к сфере ${domainArea} ` +
          `и находится в статусе «${initiative.status}». ` +
          `Источник: ${source}. ` +
          `Последнее обновление: ${lastUpdated}.\n\n` +
          `${initiative.summary}`;

        if (initiative.versions && initiative.versions.length > 0) {
          const latestVersion = initiative.versions[initiative.versions.length - 1];
          text += `\n\nПоследние изменения (версия ${latestVersion.version}, ${formatDate(latestVersion.date)}): ${latestVersion.changes}`;
        }

        if (initiative.fullTextLinks && initiative.fullTextLinks.length > 0) {
          text += '\n\nСсылка на полный текст: ' + initiative.fullTextLinks[0];
        }

        return text;
      },
    },
    {
      key: 'impact',
      title: '2. Анализ потенциального воздействия',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Анализ недоступен.';

        const riskLabel = formatRiskLevel(initiative.risk);
        const riskJustification =
          initiative.riskJustification ??
          'Детальное обоснование уровня риска требует дополнительного анализа.';

        const opportunities =
          initiative.opportunities && initiative.opportunities.length > 0
            ? initiative.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')
            : 'Потенциальные возможности требуют дополнительной оценки.';

        const economicImpact =
          initiative.estimatedEconomicImpact
            ? formatCurrencyRange(
                initiative.estimatedEconomicImpact.min,
                initiative.estimatedEconomicImpact.max
              )
            : 'оценка требуется';

        return (
          `2.1. Потенциальные риски:\n` +
          `${riskLabel} риск. ${riskJustification}\n\n` +
          `2.2. Потенциальные возможности:\n` +
          `${opportunities}\n\n` +
          `2.3. Экономический эффект:\n` +
          `Оценка экономического воздействия: ${economicImpact}.`
        );
      },
    },
    {
      key: 'stakeholders',
      title: '3. Ключевые стейкхолдеры и их позиции',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const stakeholders = ctx.stakeholders;
        if (!stakeholders || stakeholders.length === 0) {
          return 'Информация о стейкхолдерах отсутствует.';
        }

        // Take top 5 stakeholders
        const top = stakeholders.slice(0, 5);

        const lines = top.map((s, i) => {
          const stance = formatStance(s.position);
          return `${i + 1}. ${s.name} (${s.organization}, ${s.role}) \u2014 ${stance}`;
        });

        return lines.join('\n');
      },
    },
    {
      key: 'recommendations',
      title: '4. Рекомендации',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Рекомендации будут сформированы после анализа инициативы.';

        const recs = getRecommendations(initiative.risk, initiative.status);
        return recs.map((r, i) => `${i + 1}. ${r}.`).join('\n');
      },
    },
    {
      key: 'attachments',
      title: 'Приложения',
      required: false,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (
          !initiative ||
          !initiative.fullTextLinks ||
          initiative.fullTextLinks.length === 0
        ) {
          return 'Приложения отсутствуют.';
        }

        return initiative.fullTextLinks
          .map((link, i) => `${i + 1}. ${link}`)
          .join('\n');
      },
    },
  ],
};
