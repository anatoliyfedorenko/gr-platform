import type { Company } from '@/lib/types';
import type { TemplateType } from '@/lib/types';

/**
 * Maps stakeholder position (stance) to a descriptive Russian verb form.
 */
export function formatStance(position: string): string {
  const lower = position.toLowerCase();
  if (lower.includes('поддерж')) return 'поддерживает';
  if (lower.includes('нейтрал')) return 'нейтрален';
  if (lower.includes('оппозиц') || lower.includes('против')) return 'возражает';
  return 'позиция неизвестна';
}

/**
 * Normalizes any risk format to a standard Russian label.
 */
export function formatRiskLevel(risk: string): string {
  const lower = risk.toLowerCase();
  if (lower === 'high' || lower.includes('высок')) return 'Высокий';
  if (lower === 'medium' || lower.includes('средн')) return 'Средний';
  if (lower === 'low' || lower.includes('низк')) return 'Низкий';
  return 'Средний';
}

/**
 * Formats a currency range in millions of soms.
 * E.g., formatCurrencyRange(15000000, 45000000) => "от 15 до 45 млн сом"
 */
export function formatCurrencyRange(min: number, max: number): string {
  const formatValue = (v: number): string => {
    if (Math.abs(v) >= 1_000_000_000) {
      const val = v / 1_000_000_000;
      return `${Number.isInteger(val) ? val : val.toFixed(1)} млрд`;
    }
    if (Math.abs(v) >= 1_000_000) {
      const val = v / 1_000_000;
      return `${Number.isInteger(val) ? val : val.toFixed(1)} млн`;
    }
    if (Math.abs(v) >= 1_000) {
      const val = v / 1_000;
      return `${Number.isInteger(val) ? val : val.toFixed(1)} тыс.`;
    }
    return `${v}`;
  };

  return `от ${formatValue(min)} до ${formatValue(max)} сом`;
}

/**
 * Generates an outgoing letter number using company name abbreviation and counter.
 * E.g., "ТС-101/2026"
 */
export function generateOutgoingNumber(company: Company): string {
  // Build abbreviation from company name: take first letter of each word
  const words = company.name.split(/\s+/).filter(Boolean);
  const abbreviation = words
    .map((w) => w[0].toUpperCase())
    .join('');

  const counter = company.outgoingLetterNumberCounter ?? 1;
  const year = new Date().getFullYear();

  return `${abbreviation}-${counter}/${year}`;
}

/**
 * Generates an export filename for a template document.
 * E.g., "АналитическаяЗаписка_ТелекомСевер_18022026.pdf"
 */
export function generateExportFilename(
  templateType: TemplateType,
  companyName: string,
  date: string,
  format: string
): string {
  const typeNames: Record<TemplateType, string> = {
    analytical_note: 'АналитическаяЗаписка',
    legislative_amendment: 'ПредложениеПоИзменениюЗаконодательства',
    official_letter: 'ОфициальноеПисьмо',
    gr_report: 'ОтчётGR',
    presentation: 'Презентация',
  };

  const typeName = typeNames[templateType];

  // Remove spaces from company name
  const cleanCompany = companyName.replace(/\s+/g, '');

  // Format date as DDMMYYYY
  const formattedDate = formatDate(date).replace(/\./g, '');

  return `${typeName}_${cleanCompany}_${formattedDate}.${format}`;
}

/**
 * Returns 3-6 action-item recommendations from a fixed library,
 * conditioned on risk level and initiative status.
 */
export function getRecommendations(risk: string, status: string): string[] {
  const library = [
    'Подготовить официальное обращение в профильное ведомство',
    'Инициировать встречу с представителями регулятора',
    'Подготовить аналитическую записку с оценкой влияния на отрасль',
    'Провести консультации с отраслевыми ассоциациями',
    'Организовать рабочую группу с участием ключевых стейкхолдеров',
    'Разработать альтернативное предложение по формулировке нормативного акта',
    'Подготовить экономическое обоснование предлагаемых изменений',
    'Провести мониторинг международного опыта регулирования',
    'Инициировать публичное обсуждение на отраслевой площадке',
    'Направить позицию компании в рамках процедуры ОРВ',
    'Подготовить презентацию для руководства с оценкой рисков',
    'Обеспечить участие представителей компании в парламентских слушаниях',
  ];

  const riskNorm = formatRiskLevel(risk);
  const statusLower = status.toLowerCase();

  const result: string[] = [];

  // High risk always gets official communication and meeting
  if (riskNorm === 'Высокий') {
    result.push(library[0]); // official appeal
    result.push(library[1]); // meeting with regulator
    result.push(library[4]); // working group
    result.push(library[5]); // alternative proposal
    if (statusLower.includes('разработ') || statusLower.includes('рассмотр')) {
      result.push(library[9]); // position during ORV
      result.push(library[11]); // parliamentary hearings
    }
  } else if (riskNorm === 'Средний') {
    result.push(library[2]); // analytical note
    result.push(library[3]); // industry associations
    result.push(library[6]); // economic rationale
    if (statusLower.includes('разработ')) {
      result.push(library[9]); // position during ORV
    }
    if (statusLower.includes('принят') || statusLower.includes('действ')) {
      result.push(library[7]); // international experience
    }
  } else {
    // Low risk
    result.push(library[2]); // analytical note
    result.push(library[7]); // international experience monitoring
    result.push(library[10]); // presentation for leadership
  }

  // Ensure at least 3 recommendations
  while (result.length < 3) {
    const candidate = library[result.length + 2];
    if (!result.includes(candidate)) {
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Formats a date string (ISO or similar) to DD.MM.YYYY format.
 */
export function formatDate(date: string): string {
  // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  // If already in DD.MM.YYYY format, return as-is
  return date;
}
