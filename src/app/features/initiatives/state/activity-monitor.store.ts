import { computed, Injectable, signal } from '@angular/core';

import type { ActivityDetailsQueryParams } from '../models/activity-details.models';
import {
  type ChartDrillState,
  type DrillableFilterKey,
  drillClaimedFilterKeys,
  EMPTY_CHART_DRILL,
} from '../models/chart-drill.models';

export type MonitorFilterKey = 'period' | 'activityType' | 'frequency' | 'status' | 'sectoralBody';
export type MonitorFilters = Record<MonitorFilterKey, number[]>;
export type MonitorSortBy = NonNullable<ActivityDetailsQueryParams['sortBy']>;
export type SortDir = 'asc' | 'desc';

export const EMPTY_MONITOR_FILTERS: MonitorFilters = {
  period: [],
  activityType: [],
  frequency: [],
  status: [],
  sectoralBody: [],
};

/** Which manual filter group a chart drill dimension overlaps. */
const DRILL_KEY_BY_FILTER_KEY: Partial<Record<MonitorFilterKey, DrillableFilterKey>> = {
  period: 'cycle',
  status: 'status',
  sectoralBody: 'body',
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// CONCEPT: signal store with derived state | REACT: Zustand useActivityMonitorFiltersStore | INTERVIEW: state survives Monitor → Detail → Monitor hops because the store lives in the parent layout's injector, not in the page component.
@Injectable()
export class ActivityMonitorStore {
  private readonly _filters = signal<MonitorFilters>(EMPTY_MONITOR_FILTERS);
  private readonly _chartDrill = signal<ChartDrillState>(EMPTY_CHART_DRILL);
  private readonly _searchTerm = signal('');
  private readonly _sort = signal<{ sortBy: MonitorSortBy; sortDir: SortDir }>({
    sortBy: 'lastUpdate',
    sortDir: 'asc',
  });
  private readonly _page = signal(1);
  private readonly _limit = signal(10);

  readonly filters = this._filters.asReadonly();
  readonly chartDrill = this._chartDrill.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();

  /** Filters + sort + paging in one object — the table request re-runs when it changes. */
  readonly tableQuery = computed(() => ({
    filters: this._filters(),
    ...this._sort(),
    page: this._page(),
    limit: this._limit(),
  }));

  toggleValue(key: MonitorFilterKey, value: number): void {
    this.beforeFilterChange(key);
    this._filters.update((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }

  selectAll(key: MonitorFilterKey, ids: readonly number[]): void {
    this.beforeFilterChange(key);
    this._filters.update((f) => ({ ...f, [key]: [...ids] }));
  }

  clearGroup(key: MonitorFilterKey): void {
    this.beforeFilterChange(key);
    this._filters.update((f) => ({ ...f, [key]: [] }));
  }

  /** A chart drill arrived (from the URL): it owns its dimensions, so clear the overlapping
      manual checkboxes — otherwise they'd look selected while having no effect. */
  applyChartDrill(drill: ChartDrillState): void {
    this._chartDrill.set(drill);
    const claimed = drillClaimedFilterKeys(drill);
    this._filters.update((f) => {
      const next = { ...f };
      for (const [filterKey, drillKey] of Object.entries(DRILL_KEY_BY_FILTER_KEY)) {
        if (drillKey && claimed.includes(drillKey)) next[filterKey as MonitorFilterKey] = [];
      }
      return next;
    });
  }

  clearChartDrill(): void {
    this._page.set(1);
    this._chartDrill.set(EMPTY_CHART_DRILL);
  }

  setSearchTerm(value: string): void {
    this._page.set(1);
    this._searchTerm.set(value);
  }

  setSort(sortBy: MonitorSortBy, sortDir: SortDir): void {
    this._page.set(1);
    this._sort.set({ sortBy, sortDir });
  }

  setPage(page: number): void {
    this._page.set(page);
  }

  setLimit(limit: number): void {
    this._page.set(1);
    this._limit.set(limit);
  }

  /** "Clear All" in the chip strip + returning to the dashboard. */
  resetAll(): void {
    this._filters.set(EMPTY_MONITOR_FILTERS);
    this._chartDrill.set(EMPTY_CHART_DRILL);
    this._searchTerm.set('');
    this._sort.set({ sortBy: 'lastUpdate', sortDir: 'asc' });
    this._page.set(1);
    this._limit.set(10);
  }

  /** Touching a filter group resets paging and releases that dimension from the chart drill. */
  private beforeFilterChange(key: MonitorFilterKey): void {
    this._page.set(1);
    const drillKey = DRILL_KEY_BY_FILTER_KEY[key];
    if (drillKey) this._chartDrill.update((d) => ({ ...d, [drillKey]: undefined }));
  }
}
