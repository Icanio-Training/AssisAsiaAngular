import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ROUTES } from '@core/constants/routes';

import { HERO_GRADIENT } from '../constants/initiatives.constants';

/** Orange hero with "Back to Dashboard" and the "N of M activities" counter. */
@Component({
  selector: 'app-activity-monitor-hero-banner',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex h-auto min-h-[320px] flex-none items-center justify-center overflow-hidden pt-[124px] pb-12 sm:pt-[72px]"
      [style.background]="gradient"
    >
      <div
        class="absolute inset-x-3 top-3 z-10 mr-2 flex flex-nowrap items-center gap-2 sm:inset-x-5 sm:top-5 sm:gap-3 md:inset-x-8"
      >
        <a
          [routerLink]="routes.INITIATIVES"
          class="inline-flex shrink-0 items-center gap-1.5 rounded border border-white/35 bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/90 transition-colors hover:bg-white/25 hover:text-white sm:gap-2 sm:px-4 sm:py-[7px] sm:text-[12.5px]"
        >
          <span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_back</span>
          Back to Dashboard
        </a>
        <div class="hidden h-5 w-px shrink-0 bg-white/25 sm:block"></div>
        <div class="flex min-w-0 flex-nowrap items-center gap-1 whitespace-nowrap sm:gap-2">
          <span class="text-[11px] text-white/75 sm:text-[12.5px]">Activity Monitor</span>
          <span class="text-[10px] text-white/40 sm:text-xs">·</span>
          <span class="text-[10px] text-white/60 sm:text-xs"
            >{{ visibleCount() }} of {{ totalActivities() }}</span
          >
          <span class="text-[10px] text-white/40 sm:text-xs">activities</span>
        </div>
      </div>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-10 right-[8%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07)_0%,transparent_70%)]"
      ></div>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-15 left-[5%] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(99,172,219,0.15)_0%,transparent_70%)]"
      ></div>
      <h1
        class="relative z-[1] max-w-[780px] px-4 text-center text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-white sm:text-[38px]"
      >
        {{ title() }}
      </h1>
    </div>
  `,
})
export class ActivityMonitorHeroBanner {
  readonly title = input('');
  readonly visibleCount = input(0);
  readonly totalActivities = input(0);

  protected readonly routes = ROUTES;
  protected readonly gradient = HERO_GRADIENT;
}

/** "Filtered from chart: SOCA · Completed  [12 of 64]  × Clear chart filter  ← Back". */
@Component({
  selector: 'app-activity-monitor-drill-banner',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-wrap items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#BDD7FF] bg-[linear-gradient(90deg,#EEF4FF_0%,#F0F9FF_100%)] px-4.5 py-2.5"
      role="status"
    >
      <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span
          class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"
        >
          <span class="material-symbols-outlined text-[14px]" aria-hidden="true">bar_chart</span>
        </span>
        <span class="text-xs font-medium text-[#374151]">Filtered from chart:</span>
        <strong class="text-[13px] font-bold whitespace-nowrap text-[#1E3A5F]">{{
          label()
        }}</strong>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap text-white"
        >
          <span class="material-symbols-outlined text-[12px]" aria-hidden="true">list</span>
          {{ count() }} of {{ total() }}
        </span>
      </span>
      <button
        type="button"
        (click)="cleared.emit()"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[#C7D7FD] bg-white px-3.5 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-600 hover:text-white"
      >
        × Clear chart filter
      </button>
      <a
        [routerLink]="routes.INITIATIVES"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[#E2E8F0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
      >
        <span class="material-symbols-outlined text-[13px]" aria-hidden="true">arrow_back</span>
        Back to Dashboard
      </a>
    </div>
  `,
})
export class ActivityMonitorDrillBanner {
  readonly label = input.required<string>();
  readonly count = input(0);
  readonly total = input(0);
  // CONCEPT: output() | REACT: onClear callback prop | INTERVIEW: the child emits an event; the parent decides what "clear" means.
  // OLD: @Output() cleared = new EventEmitter<void>();
  readonly cleared = output();

  protected readonly routes = ROUTES;
}
