// Ported from the React app: src/features/initiatives/types/chartDrill.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

/** A drillable dimension's value — a single name for a single chart click,
    or several names when merged in from an already multi-selected filter
    (see mergeChartDrillWithFilters). */
export type DrillValue = string | string[] | undefined;

export interface ChartDrillState {
  cycle?: DrillValue;
  body?: DrillValue;
  status?: DrillValue;
  objective?: string | undefined;
  strategicMeasure?: string | undefined;
  smGoal?: string | undefined;
  label?: string | undefined;
}

export type DrillableFilterKey = 'cycle' | 'status' | 'body';

export const DRILLABLE_FILTER_KEYS = ['cycle', 'status', 'body'] as const;

export interface ChartDrillSearch {
  cycle?: DrillValue;
  body?: DrillValue;
  status?: DrillValue;
  smObjective?: string | undefined;
  smCode?: string | undefined;
  smGoal?: string | undefined;
  label?: string | undefined;
}

function toArray(value: DrillValue): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function hasDrillValue(value: DrillValue): boolean {
  return toArray(value).length > 0;
}

/** Comma-joins a multi-value drill dimension for display — "Completed" for a
    single value, "Completed, Ongoing" for several. */
export function formatDrillValue(value: DrillValue): string | undefined {
  const values = toArray(value);
  return values.length > 0 ? values.join(', ') : undefined;
}

export const EMPTY_CHART_DRILL: ChartDrillState = {};

const DRILL_DIMENSION_KEYS = [
  'cycle',
  'body',
  'status',
  'objective',
  'strategicMeasure',
  'smGoal',
] as const;

export function drillFromSearch(search: ChartDrillSearch): ChartDrillState {
  return {
    cycle: search.cycle,
    body: search.body,
    status: search.status,
    objective: search.smObjective?.toUpperCase(),
    strategicMeasure: search.smCode,
    smGoal: search.smGoal,
    label: search.label,
  };
}

export function hasDrillSearch(search: ChartDrillSearch): boolean {
  return [
    hasDrillValue(search.cycle),
    hasDrillValue(search.body),
    hasDrillValue(search.status),
    Boolean(search.smObjective),
    Boolean(search.smCode),
    Boolean(search.smGoal),
    Boolean(search.label),
  ].some(Boolean);
}

export function drillHasDimensions(drill: ChartDrillState): boolean {
  return DRILL_DIMENSION_KEYS.some((key) => hasDrillValue(drill[key]));
}

export function drillBannerLabel(drill: ChartDrillState): string {
  return (
    drill.label ??
    drill.strategicMeasure ??
    drill.objective ??
    formatDrillValue(drill.body) ??
    formatDrillValue(drill.cycle) ??
    formatDrillValue(drill.status) ??
    drill.smGoal ??
    'Chart drill-down'
  );
}

/** Filter-panel keys a chart drill currently owns. Callers (who own
    `filters`) use this to clear overlapping checkbox selections the hook
    itself never mutates parent filter state. */
export function drillClaimedFilterKeys(drill: ChartDrillState): DrillableFilterKey[] {
  return DRILLABLE_FILTER_KEYS.filter((key) => hasDrillValue(drill[key]));
}
