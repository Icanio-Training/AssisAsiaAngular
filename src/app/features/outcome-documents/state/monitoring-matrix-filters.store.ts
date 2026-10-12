import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';

import { AuthStore } from '@core/auth/auth.store';

import { EMPTY_FILTERS } from '../constants/outcome-documents.constants';
import type {
  DeclarationFilters,
  DeclarationSortKey,
  DropdownFilterKey,
  SortOrder,
} from '../models/outcome-documents.models';

interface MatrixFiltersState {
  readonly filters: DeclarationFilters;
  readonly searchTerm: string;
  readonly sortBy: DeclarationSortKey | null;
  readonly sortOrder: SortOrder;
  readonly page: number;
  readonly pageSize: number;
}

const INITIAL_STATE: MatrixFiltersState = {
  filters: EMPTY_FILTERS,
  searchTerm: '',
  sortBy: 'lastUpdateOn',
  sortOrder: 'desc',
  page: 1,
  pageSize: 10,
};

// CONCEPT: signal store service | REACT: Zustand useMonitoringMatrixFiltersStore | INTERVIEW: a root service outlives the page component, so filters survive "row → detail → back"; every update replaces the state object (immutable), so computed() selectors and OnPush views refresh.
// Changing a filter, the search or the sort always resets to page 1 (same as React's handlers).
@Injectable({ providedIn: 'root' })
export class MonitoringMatrixFiltersStore {
  private readonly auth = inject(AuthStore);
  private readonly state = signal<MatrixFiltersState>(INITIAL_STATE);

  readonly filters = computed(() => this.state().filters);
  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly sortBy = computed(() => this.state().sortBy);
  readonly sortOrder = computed(() => this.state().sortOrder);
  readonly page = computed(() => this.state().page);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly hasActiveFilters = computed(() =>
    Object.values(this.state().filters).some((ids) => ids.length > 0),
  );

  constructor() {
    // A different user (role) must not inherit the previous user's filters.
    let lastRole = this.auth.role();
    effect(() => {
      const role = this.auth.role();
      if (role !== lastRole) {
        lastRole = role;
        untracked(() => this.resetAll());
      }
    });
  }

  toggleValue(key: DropdownFilterKey, value: number): void {
    this.updateFilters((filters) => {
      const current = filters[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...filters, [key]: next };
    });
  }

  selectAll(key: DropdownFilterKey, ids: readonly number[]): void {
    this.updateFilters((filters) => ({ ...filters, [key]: [...ids] }));
  }

  clearGroup(key: DropdownFilterKey): void {
    this.updateFilters((filters) => ({ ...filters, [key]: [] }));
  }

  /** Apply several groups at once (chart drill-down). */
  patchFilters(patch: Partial<DeclarationFilters>): void {
    this.updateFilters((filters) => ({ ...filters, ...patch }));
  }

  setSearchTerm(searchTerm: string): void {
    this.state.update((s) => ({ ...s, searchTerm, page: 1 }));
  }

  setSort(sortBy: DeclarationSortKey, sortOrder: SortOrder): void {
    this.state.update((s) => ({ ...s, sortBy, sortOrder, page: 1 }));
  }

  setPage(page: number): void {
    this.state.update((s) => ({ ...s, page }));
  }

  setPageSize(pageSize: number): void {
    this.state.update((s) => ({ ...s, pageSize, page: 1 }));
  }

  resetAll(): void {
    this.state.set(INITIAL_STATE);
  }

  private updateFilters(updater: (filters: DeclarationFilters) => DeclarationFilters): void {
    this.state.update((s) => ({ ...s, filters: updater(s.filters), page: 1 }));
  }
}
