import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';

import { ROUTES } from '@core/constants/routes';
import { NotificationService } from '@core/notify/notification.service';
import { RbacService } from '@core/rbac/rbac.service';
import { BreadcrumbBar, type BreadcrumbItem } from '@shared/ui/breadcrumbs';
import { saveBlob } from '@shared/utils/download';

import { MatrixFilters } from '../components/matrix-filters';
import { MatrixTable, type MatrixPageChange } from '../components/matrix-table';
import { HERO_GRADIENT, MATRIX_LABEL } from '../constants/outcome-documents.constants';
import type {
  DeclarationQuery,
  DeclarationSortKey,
  DropdownFilterKey,
  FilterResponse,
  SortOrder,
} from '../models/outcome-documents.models';
import { DeclarationDropdownsService } from '../services/declaration-dropdowns.service';
import { OutcomeDocumentsService } from '../services/outcome-documents.service';
import { MonitoringMatrixFiltersStore } from '../state/monitoring-matrix-filters.store';
import { drillToFilterPatch } from '../utils/chart-drill';

interface PageResult {
  readonly data: FilterResponse | null;
  readonly error: boolean;
}

const sameQuery = (a: DeclarationQuery, b: DeclarationQuery): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** /outcome-documents/matrix?sector=&country= — filters, search, server-paged sortable table, CSV export. */
@Component({
  selector: 'app-monitoring-matrix-page',
  imports: [BreadcrumbBar, RouterLink, MatrixFilters, MatrixTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-[calc(100vh-76px)] flex-col' },
  template: `
    <app-breadcrumb-bar [items]="breadcrumbs" />

    <div class="flex flex-1 flex-col">
      <div
        class="flex !h-auto !min-h-[320px] !flex-none flex-col px-[30px] pt-14"
        [style.background]="heroGradient"
      >
        <div class="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <a
            [routerLink]="dashboardPath"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/35 bg-white/15 px-4 text-[13.5px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/25"
          >
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            Back to Dashboard
          </a>
          <span class="ml-auto text-xs text-white/65">{{ total() }} declarations</span>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-6 px-4 pt-[18px] pb-[22px] sm:px-8"
        >
          <h1 class="m-0 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-white">
            {{ matrixLabel }}
          </h1>

          @if (canManage()) {
            <div class="flex flex-shrink-0 flex-wrap gap-2.5 print:hidden">
              <button
                type="button"
                (click)="exportCsv()"
                [disabled]="exporting()"
                class="inline-flex items-center gap-[7px] rounded-lg bg-[#2C59A7] px-[22px] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#234a8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                  >download</span
                >
                {{ exporting() ? 'Exporting…' : 'Export' }}
              </button>
              <button
                type="button"
                (click)="print()"
                class="inline-flex items-center gap-[7px] rounded-lg border-[1.5px] border-white/40 bg-white/15 px-[22px] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
              >
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true">print</span>
                Print
              </button>
            </div>
          }
        </div>
      </div>

      <div class="flex-1 bg-[#F1F5F9] px-5 pb-[64px] sm:px-[64px]">
        <div
          class="mx-auto mt-[24px] mb-20 max-w-[1440px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,.06),0_6px_16px_-8px_rgba(15,23,42,.08)]"
        >
          <app-matrix-filters
            [filters]="store.filters()"
            [search]="store.searchTerm()"
            [dropdowns]="dropdownsData()"
            [dropdownsError]="!!dropdowns.error()"
            (toggleValue)="store.toggleValue($event.key, $event.value)"
            (selectAll)="store.selectAll($event.key, $event.ids)"
            (clearGroup)="clearGroup($event)"
            (resetAll)="store.resetAll()"
            (searchChange)="store.setSearchTerm($event)"
          />

          <app-matrix-table
            [items]="result()?.data?.items ?? []"
            [loading]="loading() && !result()"
            [refreshing]="loading() && !!result()"
            [error]="!!result()?.error"
            [sortBy]="store.sortBy()"
            [sortOrder]="store.sortOrder()"
            [page]="result()?.data?.page ?? store.page()"
            [pageSize]="store.pageSize()"
            [total]="total()"
            (sortChange)="onSort($event)"
            (pageChange)="onPage($event)"
            (rowClick)="openDeclaration($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class MonitoringMatrixPage {
  private readonly api = inject(OutcomeDocumentsService);
  private readonly dropdownService = inject(DeclarationDropdownsService);
  private readonly router = inject(Router);
  private readonly rbac = inject(RbacService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(MonitoringMatrixFiltersStore);

  // CONCEPT: query params → inputs (withComponentInputBinding) | REACT: useSearch({ from: '/_app/outcome-documents/matrix/' }) | INTERVIEW: a missing ?sector arrives as undefined (it overrides any default), so inputs here are optional with no default.
  readonly sector = input<string>();
  readonly country = input<string>();

  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'ASCC Outcome Documents', path: ROUTES.OUTCOME_DOCUMENTS },
    { label: MATRIX_LABEL },
  ];
  protected readonly matrixLabel = MATRIX_LABEL;
  protected readonly heroGradient = HERO_GRADIENT;
  protected readonly dashboardPath = ROUTES.OUTCOME_DOCUMENTS;

  protected readonly canManage = computed(() =>
    ['contributor', 'content_manager', 'admin'].includes(this.rbac.role()),
  );

  /** The 7 dropdowns (forkJoin + shareReplay inside the service → cached across visits). */
  protected readonly dropdowns = rxResource({ stream: () => this.dropdownService.getAll() });
  protected readonly dropdownsData = computed(() =>
    this.dropdowns.hasValue() ? this.dropdowns.value() : undefined,
  );

  // CONCEPT: debounceTime + distinctUntilChanged | REACT: useEffect + setTimeout(300) "useDebounce" | INTERVIEW: wait for a 300ms pause in typing and skip identical terms, so the API isn't hit on every keystroke.
  private readonly debouncedSearch = toSignal(
    toObservable(this.store.searchTerm).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: this.store.searchTerm() },
  );

  /** Everything the Filter API needs, as one signal. */
  private readonly query = computed<DeclarationQuery>(() => ({
    filters: this.store.filters(),
    search: this.debouncedSearch(),
    page: this.store.page(),
    pageSize: this.store.pageSize(),
    sortBy: this.store.sortBy(),
    sortOrder: this.store.sortOrder(),
  }));

  protected readonly loading = signal(false);

  // CONCEPT: toObservable(computed query) + switchMap | REACT: useQuery({ queryKey: ['outcome-documents','filter', query] }) | INTERVIEW: every filter/page/sort change emits a new query; switchMap UNSUBSCRIBES the previous request (HttpClient cancels it), so a slow old page can never overwrite a newer one.
  // CONCEPT: catchError + finalize | INTERVIEW: catchError turns a failed request into a value (the stream stays alive for the next query); finalize runs on success, error AND cancellation.
  protected readonly result = toSignal(
    toObservable(this.query).pipe(
      distinctUntilChanged(sameQuery),
      switchMap((query) => {
        this.loading.set(true);
        return this.api.getFilterData(query).pipe(
          map((data): PageResult => ({ data, error: false })),
          catchError(() => of<PageResult>({ data: null, error: true })),
          finalize(() => this.loading.set(false)),
        );
      }),
    ),
  );
  // Note: toSignal keeps the LAST page while the next one loads (React's keepPreviousData).

  protected readonly total = computed(() => this.result()?.data?.totalRecords ?? 0);
  protected readonly exporting = signal(false);

  /** Drill-down signature already applied — each incoming ?sector/?country is applied once. */
  private appliedDrill: string | null = null;

  constructor() {
    // Chart drill-down: map ?sector= / ?country= to dropdown ids once the dropdowns have loaded.
    effect(() => {
      const dropdowns = this.dropdownsData();
      const sector = this.sector();
      const country = this.country();
      if (!dropdowns || (!sector && !country)) return;
      const signature = `${sector ?? ''}|${country ?? ''}`;
      if (signature === this.appliedDrill) return;
      this.appliedDrill = signature;
      // untracked: the store write must not make this effect depend on the store.
      untracked(() => this.store.patchFilters(drillToFilterPatch(dropdowns, sector, country)));
    });
  }

  protected clearGroup(key: DropdownFilterKey): void {
    this.store.clearGroup(key);
  }

  protected onSort(event: { sortBy: DeclarationSortKey; sortOrder: SortOrder }): void {
    this.store.setSort(event.sortBy, event.sortOrder);
  }

  protected onPage(event: MatrixPageChange): void {
    if (event.pageSize !== this.store.pageSize()) this.store.setPageSize(event.pageSize);
    else this.store.setPage(event.page);
  }

  protected openDeclaration(id: number): void {
    void this.router.navigate([ROUTES.OUTCOME_DOCUMENTS_MATRIX, id]);
  }

  // CONCEPT: takeUntilDestroyed | REACT: an AbortController / "isMounted" check in useEffect cleanup | INTERVIEW: completes the subscription when the component is destroyed — no leaks for manual subscribe() calls.
  protected exportCsv(): void {
    this.exporting.set(true);
    this.api
      .exportDeclarations(this.query())
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => saveBlob(blob, 'ASCC_Outcome_Documents.csv'),
        error: () => this.notify.error('Could not export declarations. Please try again.'),
      });
  }

  protected print(): void {
    window.print();
  }
}
