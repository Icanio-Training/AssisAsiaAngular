// Ported from the React app: features/initiatives/utils/{filterLabels,initiativesChartData}.ts
// and components/ui/utils/chartEmptyState.ts — pure helpers, no framework code.
import type { ActivityStatus, StatusBreakdown } from '../models/initiatives.models';
import type { DropdownOption } from '../models/initiatives-filters.models';

export function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Active-filter chip text: at most 2 values, then "+N more". */
export function formatChipValue(names: readonly string[]): string {
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

export function namesFor(options: readonly DropdownOption[], ids: readonly number[]): string[] {
  const byId = new Map(options.map((o) => [o.id, o.name]));
  return ids.map((id) => byId.get(id) ?? `#${id}`);
}

const PERIOD_COLORS: Record<string, string> = {
  '2016-2020': '#FBF315',
  '2016-2025': '#6C3694',
  '2021-2025': '#2C59A7',
};

export function colorForPeriod(period: string): string {
  return PERIOD_COLORS[period] ?? '#2C59A7';
}

/** 'Objective 4.2' → 'SG4', 'SM 1.1.7' → 'SG1' (leading number = parent goal). */
export function goalIdFromCode(code: string): string {
  const match = /(\d+)/.exec(code);
  return match ? `SG${match[1]}` : '';
}

/** 'SG1' → 'Strategic Goal 1'. */
export function goalLabel(goalId: string): string {
  return `Strategic Goal ${goalId.replace('SG', '')}`;
}

/** 'Completed' → 'completed' (the API's `statuses` keys are lowercase). */
export function statusBreakdownKey(status: ActivityStatus): keyof StatusBreakdown {
  return status.toLowerCase() as keyof StatusBreakdown;
}

/** Filtered results drop codes with no activity — refill them from the unfiltered baseline
    so the legend keeps the full taxonomy (zero rows greyed out). */
export function zeroFillMissingCodes<T extends { code: string; count: number; percentage: number }>(
  baseline: readonly T[] | undefined,
  filtered: readonly T[],
): T[] {
  if (!baseline) return [...filtered];
  const filteredByCode = new Map(filtered.map((item) => [item.code, item]));
  return baseline.map(
    (item) => filteredByCode.get(item.code) ?? { ...item, count: 0, percentage: 0 },
  );
}

export function isItemsEmpty(items: readonly { count: number }[]): boolean {
  return items.length === 0 || items.every((item) => item.count === 0);
}

export function isTotalsEmpty(items: readonly { total: number }[]): boolean {
  return items.length === 0 || items.every((item) => item.total === 0);
}

export function isRatesEmpty(
  items: readonly { completionRate: number; implementationRate: number; ongoingRate: number }[],
): boolean {
  return (
    items.length === 0 ||
    items.every((i) => !i.completionRate && !i.implementationRate && !i.ongoingRate)
  );
}

export function isBodyRatesEmpty(
  items: readonly { implementationActivity: number; completionActivity: number }[],
): boolean {
  return (
    items.length === 0 ||
    items.every((i) => i.implementationActivity === 0 && i.completionActivity === 0)
  );
}

/** "01/08/2026 14:30" → { date: '01/08/2026', time: '14:30' } for the two-line table cell. */
export function splitLastUpdate(
  value: string | null | undefined,
): { date: string; time: string } | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const [date = '', ...timeParts] = trimmed.split(/\s+/);
  return { date, time: timeParts.join(' ') };
}
