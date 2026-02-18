import type { TemplateSchema, TemplateContext } from '../types';
import { formatDate, formatRiskLevel } from '../utils';

export const presentationTemplate: TemplateSchema = {
  id: 'presentation',
  name: 'Презентация',
  description:
    'Презентация для руководства с обзором регуляторных изменений, рисков и GR-активности',
  icon: 'Presentation',
  requiresAddressee: false,
  requiresInitiative: false,
  requiresPeriod: true,
  exportFormats: ['pptx'],
  availableFrom: ['initiative', 'document'],
  sections: [
    {
      key: 'slide_title',
      title: 'Слайд 1: Титульный',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const date = formatDate(ctx.currentDate);
        const period = ctx.period ?? '';
        const title = period
          ? `Обзор регуляторной среды за ${period}`
          : 'Обзор регуляторной среды';

        return (
          `${title}\n\n` +
          `[Логотип ${ctx.company.name}]\n\n` +
          `Дата: ${date}`
        );
      },
    },
    {
      key: 'slide_changes',
      title: 'Слайд 2: Ключевые регуляторные изменения',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiatives = ctx.allInitiatives ?? [];

        if (initiatives.length === 0) {
          return 'Топ-3 регуляторных изменения:\n\nИнформация об инициативах отсутствует.';
        }

        // Sort by relevanceScore descending, take top 3
        const top3 = [...initiatives]
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 3);

        const lines = top3.map((init, idx) => {
          const risk = formatRiskLevel(init.risk);
          return `${idx + 1}. ${init.title}\n   Статус: ${init.status} | Риск: ${risk}\n   ${init.summary}`;
        });

        return `Топ-3 регуляторных изменения:\n\n${lines.join('\n\n')}`;
      },
    },
    {
      key: 'slide_risks',
      title: 'Слайд 3: Риски и возможности',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiatives = ctx.allInitiatives ?? [];

        // High-risk initiatives
        const highRisk = initiatives.filter(
          (i) => formatRiskLevel(i.risk) === 'Высокий'
        );
        const withOpportunities = initiatives.filter(
          (i) => i.opportunities && i.opportunities.length > 0
        );

        let riskSection = 'РИСКИ:\n';
        if (highRisk.length === 0) {
          riskSection += '  Инициативы с высоким уровнем риска отсутствуют.\n';
        } else {
          riskSection += highRisk
            .map((i) => {
              const justification =
                i.riskJustification ?? 'требует дополнительной оценки';
              return `  - ${i.title}: ${justification}`;
            })
            .join('\n');
          riskSection += '\n';
        }

        let opportunitySection = '\nВОЗМОЖНОСТИ:\n';
        if (withOpportunities.length === 0) {
          opportunitySection +=
            '  Дополнительные возможности требуют оценки.\n';
        } else {
          const allOpportunities: string[] = [];
          for (const init of withOpportunities) {
            if (init.opportunities) {
              for (const opp of init.opportunities) {
                allOpportunities.push(`  - ${opp} (${init.title})`);
              }
            }
          }
          opportunitySection += allOpportunities.slice(0, 5).join('\n') + '\n';
        }

        return riskSection + opportunitySection;
      },
    },
    {
      key: 'slide_activity',
      title: 'Слайд 4: GR-активность и результаты',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiatives = ctx.allInitiatives ?? [];
        const stakeholders = ctx.stakeholders ?? [];

        // KPI calculations
        const totalInitiatives = initiatives.length;
        const highRiskCount = initiatives.filter(
          (i) => formatRiskLevel(i.risk) === 'Высокий'
        ).length;

        let totalInteractions = 0;
        for (const s of stakeholders) {
          totalInteractions += s.interactions?.length ?? 0;
        }

        let totalMentions = 0;
        for (const init of initiatives) {
          totalMentions += init.mediaMentions?.length ?? 0;
        }

        // Achievements - top 3 most recently updated initiatives
        const recentInitiatives = [...initiatives]
          .sort((a, b) => {
            const dateA = new Date(a.lastUpdated).getTime();
            const dateB = new Date(b.lastUpdated).getTime();
            return dateB - dateA;
          })
          .slice(0, 3);

        const achievements = recentInitiatives
          .map((init) => {
            const date = formatDate(init.lastUpdated);
            return `  - [${date}] ${init.title}: ${init.status}`;
          })
          .join('\n');

        return (
          `Ключевые показатели:\n` +
          `  - Инициатив на мониторинге: ${totalInitiatives}\n` +
          `  - Высокий риск: ${highRiskCount}\n` +
          `  - Взаимодействий со стейкхолдерами: ${totalInteractions}\n` +
          `  - Упоминаний в СМИ: ${totalMentions}\n\n` +
          `Основные достижения за период:\n` +
          `${achievements || '  Информация будет дополнена.'}`
        );
      },
    },
  ],
};
