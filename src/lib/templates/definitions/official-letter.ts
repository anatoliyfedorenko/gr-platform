import type { TemplateSchema, TemplateContext } from '../types';
import { formatDate, generateOutgoingNumber } from '../utils';

export const officialLetterTemplate: TemplateSchema = {
  id: 'official_letter',
  name: 'Официальное письмо',
  description:
    'Официальное обращение к органу государственной власти или иному адресату по вопросам регуляторных изменений',
  icon: 'Mail',
  requiresAddressee: true,
  requiresInitiative: true,
  requiresPeriod: false,
  exportFormats: ['pdf'],
  availableFrom: ['initiative', 'document'],
  sections: [
    {
      key: 'letterhead',
      title: 'Бланк организации',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const date = formatDate(ctx.currentDate);
        const outgoingNumber = generateOutgoingNumber(ctx.company);

        return `${ctx.company.name}\n\nИсх. № ${outgoingNumber}\nДата: ${date}`;
      },
    },
    {
      key: 'addressee_block',
      title: 'Адресат',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const addressee = ctx.addressee;
        if (!addressee) return 'Кому:\n[Адресат не указан]';

        let text = `Кому:\n${addressee.title}\n${addressee.name}\n${addressee.organization}`;
        if (addressee.address) {
          text += `\n${addressee.address}`;
        }
        return text;
      },
    },
    {
      key: 'greeting',
      title: 'Обращение',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const addresseeName = ctx.addressee?.name ?? 'Уважаемый коллега';
        return `Уважаемый(-ая) ${addresseeName}!`;
      },
    },
    {
      key: 'theme',
      title: 'Тема',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative) return 'Тема: [будет уточнена]';

        const domainArea = initiative.domainArea ?? initiative.topic ?? 'регулирования';

        return `Тема: О позиции ${ctx.company.name} в отношении проекта регулирования в сфере ${domainArea} («${initiative.title}»)`;
      },
    },
    {
      key: 'body',
      title: 'Содержание',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        if (!initiative)
          return 'Содержание обращения будет сформировано после выбора инициативы.';

        const domainArea = initiative.domainArea ?? initiative.topic ?? 'данной сферы';
        const source = initiative.source ?? 'уполномоченного органа';

        return (
          `${ctx.company.name} внимательно следит за развитием нормативного регулирования ` +
          `в сфере ${domainArea}. В связи с рассмотрением инициативы «${initiative.title}», ` +
          `подготовленной ${source}, считаем необходимым изложить позицию нашей компании ` +
          `по данному вопросу.\n\n` +
          `${initiative.summary}\n\n` +
          `Полагаем, что предлагаемые изменения могут оказать существенное влияние на деятельность ` +
          `участников рынка. ${ctx.company.name} выступает за сбалансированный подход к регулированию, ` +
          `учитывающий интересы всех заинтересованных сторон, и готова принять активное участие ` +
          `в обсуждении данного вопроса.`
        );
      },
    },
    {
      key: 'requests',
      title: 'Просим Вас:',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const initiative = ctx.initiative;
        const domainArea = initiative?.domainArea ?? initiative?.topic ?? 'данной сферы';

        return (
          `1. Дать официальные разъяснения по порядку применения предлагаемых норм ` +
          `в сфере ${domainArea}.\n` +
          `2. Рассмотреть возможность внесения изменений в проект с учётом позиции ` +
          `участников рынка.\n` +
          `3. Организовать рабочую встречу с участием представителей отрасли для обсуждения ` +
          `ключевых положений инициативы.`
        );
      },
    },
    {
      key: 'attachments',
      title: 'Приложения',
      required: false,
      generate: (ctx: TemplateContext): string => {
        const parts: string[] = [];

        if (ctx.initiative) {
          parts.push(`Аналитическая справка по инициативе «${ctx.initiative.title}»`);
        }

        if (
          ctx.initiative?.fullTextLinks &&
          ctx.initiative.fullTextLinks.length > 0
        ) {
          parts.push('Копия проекта нормативного акта');
        }

        if (parts.length === 0) {
          return 'Без приложений.';
        }

        return parts.map((p, i) => `${i + 1}. ${p}`).join('\n');
      },
    },
    {
      key: 'signature',
      title: 'Подпись',
      required: true,
      generate: (ctx: TemplateContext): string => {
        const execTitle = ctx.company.execTitle ?? 'Генеральный директор';
        const execName = ctx.company.execName ?? ctx.currentUser.name;

        return `С уважением,\n\n${execTitle}\n${execName}`;
      },
    },
  ],
};
