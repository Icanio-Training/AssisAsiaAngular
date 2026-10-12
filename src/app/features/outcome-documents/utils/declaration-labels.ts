// Ported from the React app: utils/declarationLabels.ts, utils/filterLabels.ts, components/badges.tsx,
// and the small helpers inside DeclarationDetailPage.tsx.
import type { DropdownOption } from '../models/outcome-documents.models';

export function idLabel(type: string): string {
  return type.toLowerCase() === 'statement' ? 'Statement ID' : 'Declaration ID';
}

export function yearLabel(type: string): string {
  return type.toLowerCase() === 'statement' ? 'Year of Statement' : 'Year of Declaration';
}

/** At most 2 values, "+N more" beyond that. */
export function formatChipValue(names: readonly string[]): string {
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

export function namesFor(options: readonly DropdownOption[], ids: readonly number[]): string[] {
  const byId = new Map(options.map((o) => [o.id, o.name.toString()]));
  return ids.map((id) => byId.get(id) ?? `#${id}`);
}

/** First non-blank value, else an em dash. */
export function firstFilled(...values: (string | null | undefined)[]): string {
  return values.find((value) => value?.trim()) ?? '—';
}

/* Official UN SDG colour palette, keyed by goal number ("SDG 5.2" → "5"). */
const SDG_COLORS: Record<string, string> = {
  '1': '#E5243B',
  '2': '#DDA63A',
  '3': '#4C9F38',
  '4': '#C5192D',
  '5': '#FF3A21',
  '6': '#26BDE2',
  '7': '#FCC30B',
  '8': '#A21942',
  '9': '#FD6925',
  '10': '#DD1367',
  '11': '#FD9D24',
  '12': '#BF8B2E',
  '13': '#3F7E44',
  '14': '#0A97D9',
  '15': '#56C02B',
  '16': '#00689D',
  '17': '#19486A',
};

export function sdgColor(tag: string): string {
  const num = tag.replace(/^SDG\s*/i, '').split('.')[0];
  return (num ? SDG_COLORS[num] : undefined) ?? '#64748B';
}

export interface BadgeStyle {
  readonly bg: string;
  readonly color: string;
  readonly label: string;
}

const TYPE_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  convention: { bg: '#EDE9F9', color: '#6C3694' },
  declaration: { bg: '#EBF0FA', color: '#2C59A7' },
  statement: { bg: '#FDF4E3', color: '#D99534' },
  jointstatement: { bg: '#EBF5EF', color: '#58946E' },
};

export function typeBadgeStyle(type: string): BadgeStyle {
  const key = type.toLowerCase().replace(/\s+/g, '');
  const style = TYPE_BADGE_STYLES[key] ?? { bg: '#F1F5F9', color: '#475569' };
  return { ...style, label: type };
}

export function levelBadgeStyle(level: string): BadgeStyle {
  const l = level.toLowerCase();
  if (l.includes('leader')) return { bg: '#FDECEA', color: '#C73935', label: 'Leader' };
  if (l.includes('minister')) return { bg: '#F1F5F9', color: '#475569', label: 'Ministerial' };
  return { bg: '#EBF5EF', color: '#58946E', label: 'Technical' };
}
