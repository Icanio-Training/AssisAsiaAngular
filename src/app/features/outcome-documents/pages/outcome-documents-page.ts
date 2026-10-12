import { ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ROUTES } from '@core/constants/routes';
import { RbacService } from '@core/rbac/rbac.service';
import { BreadcrumbBar, type BreadcrumbItem } from '@shared/ui/breadcrumbs';

import { AmsBarRankingSection } from '../components/ams-bar-ranking-section';
import { AmsMemberStatesSection } from '../components/ams-member-states-section';
import type { ChartLoadStatus } from '../components/chart-load-status';
import { DeclarationsMonitorCta } from '../components/declarations-monitor-cta';
import { OutcomeHeroBanner } from '../components/outcome-hero-banner';
import { SectorChartSection } from '../components/sector-chart-section';
import {
  COUNT_ONLY_QUERY,
  OUTCOME_CHART_IDS,
  OUTCOME_CHART_SCROLL_OFFSET_PX,
  type OutcomeChartId,
} from '../constants/outcome-documents.constants';
import { OutcomeDocumentsService } from '../services/outcome-documents.service';
import { MonitoringMatrixFiltersStore } from '../state/monitoring-matrix-filters.store';
import { OutcomeChartNavigationStore } from '../state/outcome-chart-navigation.store';

/** /outcome-documents — hero, explore band, three chart sections, "View All" CTA. */
@Component({
  selector: 'app-outcome-documents-page',
  imports: [
    BreadcrumbBar,
    OutcomeHeroBanner,
    AmsBarRankingSection,
    AmsMemberStatesSection,
    SectorChartSection,
    DeclarationsMonitorCta,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-[calc(100vh-76px)] flex-col' },
  template: `
    <app-breadcrumb-bar [items]="breadcrumbs" />

    <div class="flex-1 bg-[#F4F6FA]">
      <div class="flex min-h-[calc(100vh-120px)] flex-col">
        <app-outcome-hero-banner [summary]="summary()" />
        <div
          class="flex min-h-[146px] shrink-0 items-center justify-between gap-8 border-b border-[#E2E8F0] bg-white px-[max(64px,calc((100%-1440px)/2+64px))] pt-9 pb-10"
        >
          <h2 class="text-[23px] font-bold tracking-[-0.02em] text-[#1A3A6B]">
            Explore Follow-Up Actions
          </h2>
        </div>
      </div>

      <div class="mx-auto flex max-w-[1440px] flex-col gap-13 px-6 pt-10 pb-[100px]">
        <app-ams-bar-ranking-section
          [charts]="chartsData()"
          [status]="chartStatus()"
          (drill)="drillToCountry(ids.currentStatusOfFollowUpActionsByCountry, $event)"
        />
        <app-ams-member-states-section
          [charts]="chartsData()"
          [status]="chartStatus()"
          (drill)="drillToCountry(ids.followUpActionsAcrossMemberStates, $event)"
        />

        <!-- Below the fold: the donut's code + Chart.js setup load only when scrolled near. -->
        @defer (on viewport) {
          <app-sector-chart-section
            [charts]="chartsData()"
            [status]="chartStatus()"
            [downloadable]="canDownload()"
            (drill)="drillToSector($event)"
          />
        } @placeholder {
          <!-- Same DOM id as the real card, so "scroll back to this chart" can target it before it loads. -->
          <div
            [id]="ids.followUpActionsAcrossSectors + '-card'"
            class="min-h-[500px] rounded-xl border border-[#E2E8F0] bg-white"
          ></div>
        }

        <app-declarations-monitor-cta [totalRecords]="totalRecords()" (viewAll)="viewAll()" />
      </div>
    </div>
  `,
})
export class OutcomeDocumentsPage {
  private readonly api = inject(OutcomeDocumentsService);
  private readonly router = inject(Router);
  private readonly rbac = inject(RbacService);
  private readonly chartNav = inject(OutcomeChartNavigationStore);
  private readonly matrixFilters = inject(MonitoringMatrixFiltersStore);
  private readonly scroller = inject(ViewportScroller);
  private readonly injector = inject(Injector);

  protected readonly ids = OUTCOME_CHART_IDS;
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'ASCC Outcome Documents' },
  ];

  // CONCEPT: toSignal | REACT: const { data } = useQuery(...) | INTERVIEW: subscribes immediately, unsubscribes when the component is destroyed, and exposes the latest value as a signal (undefined until the first emission).
  protected readonly summary = toSignal(this.api.getBanner().pipe(catchError(() => of(undefined))));

  // CONCEPT: rxResource | REACT: useQuery({ queryKey: ['outcome-documents','charts'] }) | INTERVIEW: wraps an Observable loader in a Resource with value/isLoading/error/hasValue signals; one request feeds all three chart sections.
  protected readonly charts = rxResource({ stream: () => this.api.getCharts() });
  // value() throws while the resource is in an error state, so guard with hasValue().
  protected readonly chartsData = computed(() =>
    this.charts.hasValue() ? this.charts.value() : undefined,
  );
  protected readonly chartStatus = computed<ChartLoadStatus>(() => {
    if (this.charts.error()) return 'error';
    return this.charts.hasValue() ? 'ready' : 'loading';
  });

  protected readonly totalRecords = toSignal(
    this.api.getFilterData(COUNT_ONLY_QUERY).pipe(
      map((res) => res.totalRecords),
      catchError(() => of(0)),
    ),
    { initialValue: 0 },
  );

  /** Guests can't download chart PNGs. */
  protected readonly canDownload = computed(() => this.rbac.role() !== 'guest');

  constructor() {
    // Back from a chart drill-down: once the charts have rendered, scroll to the card we left from.
    effect(() => {
      const returnId = this.chartNav.returnChartId();
      if (!returnId || this.chartStatus() !== 'ready') return;
      untracked(() => this.chartNav.clear());
      // afterNextRender: wait until the DOM reflects the new chart data.
      afterNextRender(() => this.scrollToChart(returnId), { injector: this.injector });
    });
  }

  protected drillToCountry(chartId: OutcomeChartId, code: string): void {
    this.chartNav.setReturnChartId(chartId);
    void this.router.navigate([ROUTES.OUTCOME_DOCUMENTS_MATRIX], {
      queryParams: { country: code },
    });
  }

  protected drillToSector(sector: string): void {
    this.chartNav.setReturnChartId(OUTCOME_CHART_IDS.followUpActionsAcrossSectors);
    void this.router.navigate([ROUTES.OUTCOME_DOCUMENTS_MATRIX], { queryParams: { sector } });
  }

  /** "View All" = the unfiltered matrix: forget leftover filters and any pending chart return. */
  protected viewAll(): void {
    this.matrixFilters.resetAll();
    this.chartNav.clear();
    void this.router.navigate([ROUTES.OUTCOME_DOCUMENTS_MATRIX]);
  }

  // CONCEPT: ViewportScroller | REACT: document.getElementById(id).getBoundingClientRect() + window.scrollTo | INTERVIEW: Angular's SSR-safe scrolling API; scrollToAnchor() finds the element by id and honours the offset (sticky header + breadcrumb bar).
  private scrollToChart(chartId: OutcomeChartId): void {
    this.scroller.setOffset([0, OUTCOME_CHART_SCROLL_OFFSET_PX]);
    this.scroller.scrollToAnchor(`${chartId}-card`);
    this.scroller.setOffset([0, 0]); // don't leak the offset to other pages
  }
}
