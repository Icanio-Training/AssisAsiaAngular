import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ROUTES } from '@core/constants/routes';

import { HERO_STAT_LABELS } from '../constants/strategic-goal-cards';
import { BlueprintKpiService } from '../services/blueprint-kpi.service';

/** "—" until the banner API returns the number. */
function formatHeroStat(value: number | null | undefined): string {
  return value === undefined || value === null ? '—' : String(value);
}

// Ported from React: components/BlueprintKpiHeroBanner.tsx
// CONCEPT: OnPush is the default in Angular 22 | REACT: every component re-renders with its parent unless memo() | INTERVIEW: Angular only re-checks this view when an input/signal it reads changes or an event fires inside it.
// OLD: @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
@Component({
  selector: 'app-blueprint-kpi-hero-banner',
  imports: [RouterLink],
  host: { class: 'contents' },
  template: `
    <div
      class="relative isolate flex flex-col items-start overflow-hidden bg-[linear-gradient(215deg,#F6A11E_0%,#E5391F_42%,#9E1C3F_78%,#5A1230_100%)]"
      [class]="isGoal() ? 'flex-none justify-start' : 'flex-1 justify-center'"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-[60px] right-[6%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]"
      ></div>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-20 left-[3%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(227,181,5,0.12)_0%,transparent_70%)]"
      ></div>

      @if (isGoal()) {
        <div class="relative w-full px-11 pt-11">
          <a
            [routerLink]="routes.BLUEPRINT_KPI"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.22] bg-white/[0.06] px-[17px] text-[13.5px] leading-[normal] font-semibold text-white transition-[border-color,background-color,transform] duration-200 hover:-translate-x-0.5 hover:border-white/50 hover:bg-white/[0.13]"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
              class="h-3.5 w-3.5"
            >
              <path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      }

      <div class="relative w-full px-16" [class]="isGoal() ? 'pt-[42px] pb-[49px]' : 'py-[22px]'">
        <div class="max-w-[720px]">
          <h1 class="text-left text-[46px] leading-[1.28] font-bold tracking-[-0.015em] text-white">
            {{ banner()?.title ?? '' }}
          </h1>
          <p class="mt-3 max-w-[720px] text-[14px] leading-[1.6] text-white/85">
            {{ banner()?.description ?? '' }}
          </p>
          <div class="mt-[22px] flex flex-wrap items-start gap-14">
            @for (stat of stats(); track stat.label) {
              <div class="flex flex-col">
                <span class="text-[30px] leading-none font-extrabold text-white">{{
                  stat.number
                }}</span>
                <span
                  class="mt-1.5 text-[11.5px] leading-[normal] tracking-[0.05em] text-white/[0.82] uppercase"
                >
                  {{ stat.label }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BlueprintKpiHeroBanner {
  private readonly service = inject(BlueprintKpiService);

  /** `landing` fills the viewport with the Explore section; `goal` is the compact
      Strategic Goal page banner with a Back to Dashboard button. */
  readonly variant = input<'landing' | 'goal'>('landing');

  protected readonly routes = ROUTES;
  protected readonly isGoal = computed(() => this.variant() === 'goal');

  // CONCEPT: rxResource | REACT: useQuery({ queryKey, queryFn }) | INTERVIEW: wraps an Observable in signals — value(), isLoading(), error() — and unsubscribes automatically when the component is destroyed.
  private readonly bannerResource = rxResource({ stream: () => this.service.banner$ });
  private readonly goalsResource = rxResource({ stream: () => this.service.strategicGoals$ });

  // value() THROWS while a resource is in the error state — hasValue() guards it.
  protected readonly banner = computed(() =>
    this.bannerResource.hasValue() ? this.bannerResource.value() : undefined,
  );
  private readonly goalCount = computed(() =>
    this.goalsResource.hasValue() ? this.goalsResource.value().length : undefined,
  );

  protected readonly stats = computed(() => {
    const banner = this.banner();
    return [
      // The goal cards are a live count too, until the banner sends its own.
      {
        number: formatHeroStat(banner?.strategicGoals ?? this.goalCount()),
        label: HERO_STAT_LABELS.strategicGoalCount,
      },
      {
        number: formatHeroStat(banner?.totalStrategicMeasures),
        label: HERO_STAT_LABELS.strategicMeasureCount,
      },
      { number: formatHeroStat(banner?.totalKPIs), label: HERO_STAT_LABELS.kpiCount },
    ];
  });
}
