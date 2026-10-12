import { computed, Injectable, signal } from '@angular/core';

import {
  EMPTY_INITIATIVES_FILTERS,
  type InitiativesChartsQueryParams,
  type InitiativesFilters,
} from '../models/initiatives-filters.models';

export type MultiFilterKey = 'period' | 'activityStatus' | 'sectoralBody';

// CONCEPT: signal store service (scoped by the provider) | REACT: Zustand `useInitiativesFiltersStore` + useInitiativesFilterNavigationReset | INTERVIEW: provided in InitiativesLayout's `providers`, so ONE instance lives while the user is anywhere under /initiatives and is destroyed (= reset) when they leave — no manual reset hook needed.
// OLD: private state$ = new BehaviorSubject<InitiativesFilters>(EMPTY); filters$ = this.state$.asObservable();
@Injectable()
export class InitiativesFiltersStore {
  private readonly _filters = signal<InitiativesFilters>(EMPTY_INITIATIVES_FILTERS);
  /** The chart a drill-down started from — the dashboard scrolls back to it on return. */
  private readonly _returnChartId = signal<string | null>(null);

  readonly filters = this._filters.asReadonly();
  readonly returnChartId = this._returnChartId.asReadonly();

  readonly hasActiveFilters = computed(() => {
    const f = this._filters();
    return (
      f.period.length > 0 ||
      f.activityStatus.length > 0 ||
      f.sectoralBody.length > 0 ||
      f.strategicGoal !== null
    );
  });

  /** "Filters (N)" — the goal→objective→measure cascade counts as one dimension. */
  readonly totalSelectedCount = computed(() => {
    const f = this._filters();
    return (
      f.period.length +
      f.activityStatus.length +
      f.sectoralBody.length +
      (f.strategicGoal !== null ? 1 : 0)
    );
  });

  /** One params object shared by Zone 1 and Zone 2 (React: useMemo in useInitiativesFilters). */
  readonly queryParams = computed<InitiativesChartsQueryParams>(() => {
    const f = this._filters();
    return {
      period: f.period.length ? f.period : undefined,
      activityStatus: f.activityStatus.length ? f.activityStatus : undefined,
      sectoralBody: f.sectoralBody.length ? f.sectoralBody : undefined,
      strategicGoal: f.strategicGoal ?? undefined,
      objective: f.objective ?? undefined,
      strategicMeasure: f.strategicMeasure ?? undefined,
    };
  });

  // Immutable updates: always a NEW object/array, so computed()s and OnPush views see the change.
  toggleValue(key: MultiFilterKey, value: number): void {
    this._filters.update((f) => {
      const current = f[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [key]: next };
    });
  }

  selectAll(key: MultiFilterKey, ids: readonly number[]): void {
    this._filters.update((f) => ({ ...f, [key]: [...ids] }));
  }

  clearGroup(key: MultiFilterKey): void {
    this._filters.update((f) => ({ ...f, [key]: [] }));
  }

  /** Picking a goal resets the levels below it (cascade). */
  setGoal(id: number | null): void {
    this._filters.update((f) => ({
      ...f,
      strategicGoal: id,
      objective: null,
      strategicMeasure: null,
    }));
  }

  setObjective(id: number | null): void {
    this._filters.update((f) => ({ ...f, objective: id, strategicMeasure: null }));
  }

  setMeasure(id: number | null): void {
    this._filters.update((f) => ({ ...f, strategicMeasure: id }));
  }

  resetAll(): void {
    this._filters.set(EMPTY_INITIATIVES_FILTERS);
  }

  setReturnChartId(id: string): void {
    this._returnChartId.set(id);
  }

  /** Read-and-clear: the dashboard calls this once when it is created. */
  consumeReturnChartId(): string | null {
    const id = this._returnChartId();
    this._returnChartId.set(null);
    return id;
  }
}
