import type { TemplateSchema, TemplateContext } from '../types';
import { formatDate, formatCurrencyRange } from '../utils';

export const legislativeAmendmentTemplate: TemplateSchema = {
  id: 'legislative_amendment',
  name: 'Предложение по изменению законодательства',
  description:
    'Официальное предложение по внесению изменений в нормативный правовой акт с обоснованием и ожидаемыми результатами',
  icon: 'Scale',
  requiresAddressee: true,
  requiresInitiative: true,
  requiresPeriod: false,
  exportFormats: ['pdf'],
  availableFrom: ['initiative', 'document'],
  sections: [
    {
      key: 'header',
      title: 'Заголовок',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const config = ctx.config ?? {};
        const targetAct = (config.targetAct as string) ?? 'нормативного акта';
        const changeGoal =
          (config.changeGoal as string) ?? 'совершенствования регулирования';
        const date = formatDate(ctx.currentDate);
        const grCenter =
          ctx.company.grCenterName ??
          'Центр по взаимодействию с органами государственной власти';
        const addresseeName = ctx.addressee?.name ?? 'Уполномоченный орган';

        return (
          `Предложение по изменению ${targetAct}\n\n` +
          `Дата: ${date}\n` +
          `От: ${ctx.company.name} (через ${grCenter})\n` +
          `Кому: ${addresseeName}\n` +
          `Тема: О необходимости внесения изменений в ${targetAct} для ${changeGoal}`
        );
      },
    },
    {
      key: 'problem',
      title: '1. Существующая проблема',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Описание проблемы будет добавлено.';

        const domainArea = initiative.domainArea ?? initiative.topic ?? 'данной сферы';

        return (
          `В настоящее время в сфере ${domainArea} существует ряд нормативных пробелов и противоречий, ` +
          `оказывающих негативное влияние на деятельность участников рынка.\n\n` +
          `${initiative.summary}\n\n` +
          `Действующее регулирование не в полной мере учитывает современные реалии и создаёт ` +
          `правовую неопределённость для хозяйствующих субъектов. Указанная ситуация требует ` +
          `оперативного законодательного реагирования.`
        );
      },
    },
    {
      key: 'changes',
      title: '2. Предлагаемые изменения',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const config = ctx.config ?? {};
        const targetAct = (config.targetAct as string) ?? 'указанный нормативный акт';

        return (
          `Предлагается внести изменения в ${targetAct}, изложив в следующей редакции:\n\n` +
          `[Текст предлагаемой редакции]\n\n` +
          `Предлагаемые изменения направлены на устранение выявленных пробелов в правовом ` +
          `регулировании и создание условий для устойчивого развития отрасли.`
        );
      },
    },
    {
      key: 'rationale',
      title: '3. Обоснование предлагаемых изменений',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        const config = ctx.config ?? {};
        const includeInternational = config.includeInternational !== false;

        // Economic rationale
        let economicText: string;
        if (initiative?.estimatedEconomicImpact) {
          const range = formatCurrencyRange(
            initiative.estimatedEconomicImpact.min,
            initiative.estimatedEconomicImpact.max
          );
          economicText =
            `Принятие предлагаемых изменений позволит снизить регуляторные издержки для участников ` +
            `рынка. Оценочный экономический эффект составляет ${range}. ` +
            `Предлагаемые изменения будут способствовать повышению инвестиционной привлекательности ` +
            `отрасли и созданию предсказуемой регуляторной среды.`;
        } else {
          economicText =
            `Принятие предлагаемых изменений позволит снизить регуляторные издержки для участников ` +
            `рынка. Детальная оценка экономического эффекта требует дополнительного анализа. ` +
            `Предлагаемые изменения будут способствовать повышению инвестиционной привлекательности ` +
            `отрасли и созданию предсказуемой регуляторной среды.`;
        }

        // Social rationale
        const socialText =
          `Предлагаемые изменения направлены на повышение качества и доступности услуг для ` +
          `конечных потребителей. Совершенствование нормативной базы позволит обеспечить баланс ` +
          `интересов бизнеса, государства и общества, а также будет способствовать развитию ` +
          `конкурентной среды.`;

        let result =
          `3.1. Экономическое обоснование:\n${economicText}\n\n` +
          `3.2. Социальное обоснование:\n${socialText}`;

        if (includeInternational) {
          const internationalText =
            `Анализ международного опыта показывает, что в ряде стран (ЕС, Великобритания, ` +
            `Республика Корея) аналогичные вопросы решены путём принятия специализированных ` +
            `нормативных актов, обеспечивающих сбалансированное регулирование. Целесообразно ` +
            `учесть данный опыт при разработке отечественного законодательства.`;

          result += `\n\n3.3. Международный опыт:\n${internationalText}`;
        }

        return result;
      },
    },
    {
      key: 'results',
      title: '4. Ожидаемые результаты',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        const domainArea = initiative?.domainArea ?? initiative?.topic ?? 'отрасли';

        const opportunities =
          initiative?.opportunities && initiative.opportunities.length > 0
            ? initiative.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')
            : '';

        let text =
          `Принятие предлагаемых изменений обеспечит:\n\n` +
          `1. Устранение правовой неопределённости в сфере ${domainArea}.\n` +
          `2. Создание благоприятных условий для развития отрасли и привлечения инвестиций.\n` +
          `3. Повышение качества услуг для конечных потребителей.\n` +
          `4. Формирование предсказуемой и стабильной регуляторной среды.`;

        if (opportunities) {
          text += `\n\nДополнительные возможности:\n${opportunities}`;
        }

        return text;
      },
    },
  ],
};
