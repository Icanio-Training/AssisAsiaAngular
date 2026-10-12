import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

import { ROUTES } from '@core/constants/routes';
import { BreadcrumbBar, type BreadcrumbItem } from '@shared/ui/breadcrumbs';

import { KPI_SECTION_LABEL, strategicGoalBreadcrumbLabel } from './constants/strategic-goal-cards';
import { parseKpiParam } from './utils/kpi-param';
import { BlueprintKpiService } from './services/blueprint-kpi.service';

const GOAL_DETAIL_PATH = /^\/blueprint-kpi\/(\d+)\/?$/;

interface KpiLocation {
  goalId: number | null;
  kpiId: number | null;
}

// Ported from React: routes/_app.blueprint-kpi.tsx (layout) + useBlueprintKpiBreadcrumbs().
// Breadcrumbs: ASCC Strategic Plan KPIs › <goal short title> › <KPI code>
@Component({
  selector: 'app-blueprint-kpi-layout',
  imports: [BreadcrumbBar, RouterOutlet],
  host: { class: 'flex min-h-[calc(100vh-76px)] flex-col' },
  template: `
    <app-breadcrumb-bar [items]="breadcrumbs()" />
    <router-outlet />
  `,
})
export class BlueprintKpiLayout {
  private readonly router = inject(Router);
  private readonly service = inject(BlueprintKpiService);

  /** goalId / ?kpi from the current URL, re-read after every navigation. */
  private readonly location$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map((): KpiLocation => {
      const tree = this.router.parseUrl(this.router.url);
      const path =
        '/' + (tree.root.children['primary']?.segments.map((s) => s.path).join('/') ?? '');
      const match = GOAL_DETAIL_PATH.exec(path);
      const goalId = match ? Number(match[1]) : null;
      const kpi: unknown = tree.queryParams['kpi'];
      return {
        goalId,
        kpiId: goalId === null ? null : parseKpiParam(typeof kpi === 'string' ? kpi : undefined),
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // CONCEPT: switchMap on a changing id | REACT: useQuery(['…', id]) re-keyed by the URL | INTERVIEW: each new goal/kpi id switches to a new (cached) request and UNSUBSCRIBES from the previous one, so a slow old response can never overwrite the newer label.
  private readonly goal = toSignal(
    this.location$.pipe(
      map((loc) => loc.goalId),
      distinctUntilChanged(),
      switchMap((id) =>
        id === null ? of(null) : this.service.getStrategicGoal(id).pipe(catchError(() => of(null))),
      ),
    ),
    { initialValue: null },
  );

  private readonly kpiCode = toSignal(
    this.location$.pipe(
      map((loc) => loc.kpiId),
      distinctUntilChanged(),
      switchMap((id) =>
        id === null
          ? of(null)
          : this.service.getDeepAnalysis(id).pipe(
              map((record) => record.kpiCode),
              catchError(() => of(null)),
            ),
      ),
    ),
    { initialValue: null },
  );

  private readonly location = toSignal(this.location$, {
    initialValue: { goalId: null, kpiId: null },
  });

  protected readonly breadcrumbs = computed((): BreadcrumbItem[] => {
    const { goalId, kpiId } = this.location();
    if (goalId === null) return [{ label: KPI_SECTION_LABEL }];

    const goal = this.goal();
    const goalLabel = goal ? strategicGoalBreadcrumbLabel(goal) : 'Strategic Goal';
    const items: BreadcrumbItem[] = [{ label: KPI_SECTION_LABEL, path: ROUTES.BLUEPRINT_KPI }];
    if (kpiId === null) return [...items, { label: goalLabel, truncate: true }];
    return [
      ...items,
      { label: goalLabel, path: [ROUTES.BLUEPRINT_KPI, goalId] },
      { label: this.kpiCode() ?? 'SM KPI', truncate: true },
    ];
  });
}
