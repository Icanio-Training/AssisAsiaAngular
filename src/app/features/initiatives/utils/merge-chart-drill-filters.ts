// Ported from the React app: features/initiatives/utils/mergeChartDrillFilters.ts (pure — unchanged logic).
import type { ChartDrillSearch } from '../models/chart-drill.models';
import type {
  DropdownOption,
  InitiativesChartsQueryParams,
} from '../models/initiatives-filters.models';

export interface DrillDropdowns {
  periods: readonly DropdownOption[];
  statuses: readonly DropdownOption[];
  sectoralBodies: readonly DropdownOption[];
}

/** Ids of a (possibly multi-selected) filter group → one name, or an array of names. */
function namesForSelection(
  ids: readonly number[] | undefined,
  options: readonly DropdownOption[],
): string | string[] | undefined {
  if (!ids || ids.length === 0) return undefined;
  const names = ids
    .map((id) => options.find((o) => o.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return undefined;
  return names.length === 1 ? names[0] : names;
}

function formatNames(names: string | string[]): string {
  return Array.isArray(names) ? names.join(', ') : names;
}

/**
 * A chart click carries ONE dimension (e.g. `body: 'SOCA'`). The dashboard filter bar may
 * already narrow other dimensions (period / status / body) — carry those over by NAME so the
 * Activity Monitor shows the same subset the chart was drawn from, and prefix the banner label.
 */
export function mergeChartDrillWithFilters(
  search: ChartDrillSearch,
  queryParams: InitiativesChartsQueryParams,
  dropdowns: DrillDropdowns | undefined,
): ChartDrillSearch {
  if (!dropdowns) return search;

  const periodNames = namesForSelection(queryParams.period, dropdowns.periods);
  const statusNames = namesForSelection(queryParams.activityStatus, dropdowns.statuses);
  const bodyNames = namesForSelection(queryParams.sectoralBody, dropdowns.sectoralBodies);

  const merged: ChartDrillSearch = { ...search };
  const extraLabels: string[] = [];

  if (merged.cycle === undefined && periodNames) {
    merged.cycle = periodNames;
    extraLabels.push(`Period: ${formatNames(periodNames)}`);
  }
  if (merged.status === undefined && statusNames) {
    merged.status = statusNames;
    extraLabels.push(`Status: ${formatNames(statusNames)}`);
  }
  if (merged.body === undefined && bodyNames) {
    merged.body = bodyNames;
    extraLabels.push(`Body: ${formatNames(bodyNames)}`);
  }

  if (extraLabels.length > 0) {
    merged.label = [...extraLabels, merged.label].filter(Boolean).join(' · ');
  }
  return merged;
}

/** Drops undefined keys so the router never writes `?cycle=undefined`. */
export function toDrillQueryParams(search: ChartDrillSearch): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(search) as [string, string | string[] | undefined][]) {
    if (value !== undefined && value !== '') params[key] = value;
  }
  return params;
}
