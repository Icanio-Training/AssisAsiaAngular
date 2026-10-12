import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, throwError } from 'rxjs';

import { BlueprintKpiHeroBanner } from '../components/blueprint-kpi-hero-banner';
import { KpiDetailView } from '../components/kpi-detail-view';
import { StrategicGoalPanel } from '../components/strategic-goal-panel';
import type { StrategicGoalDetail } from '../models/blueprint-kpi.models';
import { BlueprintKpiService } from '../services/blueprint-kpi.service';
import { parseKpiParam } from '../utils/kpi-param';

const HIGHLIGHT_MS = 1400;

type GoalResult = { found: true; goal: StrategicGoalDetail } | { found: false };

function objectiveIdFor(goal: StrategicGoalDetail, deepAnalysisId: number): number | null {
  const objective = goal.objectives.find((o) =>
    o.strategicMeasures.some((m) => m.kpis.some((k) => k.deepAnalysisId === deepAnalysisId)),
  );
  return objective?.id ?? null;
}

// Ported from React: components/StrategicGoalPage.tsx + routes/_app.blueprint-kpi.$goalId.tsx
// Route: /blueprint-kpi/:goalId?kpi=<deepAnalysisId>
@Component({
  selector: 'app-strategic-goal-page',
  imports: [BlueprintKpiHeroBanner, KpiDetailView, StrategicGoalPanel],
  host: { class: 'flex flex-1 flex-col' },
  template: `
    <div class="flex flex-1 flex-col bg-[#F4F6FA] pb-14">
      <app-blueprint-kpi-hero-banner variant="goal" />
      <div class="mx-auto mt-7 w-full max-w-[1448px] px-6">
        @if (goal(); as goal) {
          <!-- Master–detail "fly-in": the panel eases from full width to a 42% / 560px column,
               then the SM KPI detail fades into the freed space. Stacked below lg.
               scroll-mt = nav 76 + breadcrumb 44 + 26px gap. -->
          <div
            #columns
            class="flex scroll-mt-[146px] flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:transition-[gap] lg:duration-[560ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            [class]="selectedKpiId() !== null ? 'lg:gap-6' : 'lg:gap-0'"
          >
            <div
              class="w-full min-w-0 lg:shrink-0 lg:transition-[width,max-width] lg:duration-[560ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              [class]="selectedKpiId() !== null ? 'lg:w-[42%] lg:max-w-[560px]' : 'lg:max-w-full'"
            >
              <app-strategic-goal-panel
                [goal]="goal"
                [selectedKpiId]="selectedKpiId()"
                [highlightObjectiveId]="highlightObjectiveId()"
                (selectKpi)="selectKpi($event)"
              />
            </div>
            @if (selectedKpiId(); as kpiId) {
              <div
                class="min-w-0 flex-1 opacity-100 transition-opacity delay-[140ms] duration-[420ms] ease-out motion-reduce:transition-none starting:opacity-0"
              >
                <app-kpi-detail-view
                  [deepAnalysisId]="kpiId"
                  [goalCode]="goal.code"
                  (closed)="closeKpi()"
                />
              </div>
            }
          </div>
        } @else {
          <p class="py-16 text-center text-[14px] text-[#5A6B85]" role="status">
            {{ statusText() }}
          </p>
        }
      </div>
    </div>
  `,
})
export class StrategicGoalPage {
  private readonly service = inject(BlueprintKpiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // CONCEPT: route params as inputs (withComponentInputBinding) | REACT: Route.useParams() / Route.useSearch() | INTERVIEW: the router sets EVERY input of a routed component from params / query params / data — a missing key becomes undefined, so optional ones are typed `| undefined` and validated in computed().
  readonly goalId = input.required<string>();
  readonly kpi = input<string>();

  private readonly goalIdNumber = computed(() => {
    const id = Number(this.goalId());
    return Number.isInteger(id) && id > 0 ? id : undefined;
  });
  protected readonly selectedKpiId = computed(() => parseKpiParam(this.kpi()));

  // params → undefined keeps the resource idle (an invalid :goalId never hits the API).
  private readonly goalResource = rxResource<GoalResult, number | undefined>({
    params: () => this.goalIdNumber(),
    stream: ({ params: id }) =>
      this.service.getStrategicGoal(id).pipe(
        map((goal): GoalResult => ({ found: true, goal })),
        // CONCEPT: catchError → a typed "not found" state | REACT: isError + retry: retryUnlessNotFound | INTERVIEW: a 404 becomes a normal value (no retry — retryGetInterceptor only retries 0/5xx); any other error is re-thrown into resource.error().
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of<GoalResult>({ found: false })
            : throwError(() => error),
        ),
      ),
  });

  protected readonly goal = computed(() => {
    const result = this.goalResource.hasValue() ? this.goalResource.value() : undefined;
    return result?.found ? result.goal : undefined;
  });

  protected readonly statusText = computed(() => {
    if (this.goalIdNumber() === undefined) return 'Strategic goal not found.';
    if (this.goalResource.isLoading()) return 'Loading…';
    if (this.goalResource.error()) return "We couldn't load this strategic goal.";
    return 'Strategic goal not found.';
  });

  protected readonly highlightObjectiveId = signal<number | null>(null);
  private readonly columns = viewChild<ElementRef<HTMLElement>>('columns');

  constructor() {
    // Blueprint openDetailView(): on opening (or switching) a KPI, scroll the columns'
    // tops just under the sticky nav + breadcrumb.
    afterRenderEffect(() => {
      const columns = this.columns();
      if (columns && this.selectedKpiId() !== null) {
        columns.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Flash the objective the user closed back to, then let it fade.
    // CONCEPT: effect cleanup (onCleanup) | REACT: useEffect returning () => clearTimeout(timer) | INTERVIEW: cleanup runs before the next run and on destroy, so a stale timer never fires.
    effect((onCleanup) => {
      if (this.highlightObjectiveId() === null) return;
      const timer = setTimeout(() => this.highlightObjectiveId.set(null), HIGHLIGHT_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected selectKpi(deepAnalysisId: number): void {
    // scroll: 'manual' = React's resetScroll: false — opening a KPI must not jump to the banner.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { kpi: deepAnalysisId },
      scroll: 'manual',
    });
  }

  protected closeKpi(): void {
    const goal = this.goal();
    const kpiId = this.selectedKpiId();
    if (goal && kpiId !== null) this.highlightObjectiveId.set(objectiveIdFor(goal, kpiId));
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, scroll: 'manual' });
  }
}
