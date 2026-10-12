import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ROUTES } from '@core/constants/routes';

import {
  CARD_MIN_HEIGHT,
  type CardSize,
  OBJECTIVE_SHORT_NAMES,
  STRATEGIC_GOAL_TINTS,
  type StrategicGoalCode,
  strategicGoalFullTitle,
  strategicGoalImage,
} from '../constants/strategic-goal-cards';
import type { StrategicGoalSummary } from '../models/blueprint-kpi.models';
import { ObjectivesBadge } from './objectives-badge';

// Ported from React: components/StrategicGoalCard.tsx
@Component({
  selector: 'app-strategic-goal-card',
  imports: [RouterLink, NgOptimizedImage, ObjectivesBadge],
  host: { class: 'flex w-full' },
  template: `
    <a
      [routerLink]="[routes.BLUEPRINT_KPI, goal().id]"
      [attr.aria-label]="ariaLabel()"
      [style.--tint]="tint()"
      class="group relative flex w-full cursor-pointer flex-col rounded-xl shadow-scd-sm transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_4px_12px_rgba(44,89,167,.16),0_12px_32px_rgba(44,89,167,.10)] focus-visible:-translate-y-[3px] focus-visible:outline-none"
      [class]="minHeight()"
    >
      <!-- Photo + scrim clipped in their own layer so the card corners crop the image
           without clipping anything else (e.g. the badge focus ring). -->
      <div class="absolute inset-0 overflow-hidden rounded-[inherit]">
        <!-- CONCEPT: NgOptimizedImage "fill" mode | REACT: <img loading="lazy" className="absolute inset-0 object-cover"> | INTERVIEW: fill replaces width/height for a cover image that stretches over a positioned parent; lazy loading is still the default. -->
        <img [ngSrc]="image()" alt="" fill class="object-cover object-center" />
        <div
          class="absolute inset-0 bg-[linear-gradient(160deg,var(--tint)_0%,var(--tint)_42%,rgba(16,25,43,0)_82%)] opacity-90"
        ></div>
      </div>

      <div class="relative z-[2] flex flex-col gap-2 p-3.5 text-white">
        <div
          class="text-[12.5px] leading-[1.32] font-bold [text-shadow:0_1px_4px_rgba(0,0,0,.45)] lg:text-[clamp(12.5px,1.25vw,15px)]"
        >
          {{ fullTitle() }}
        </div>
        <div class="flex flex-col items-start gap-1.5">
          <app-objectives-badge
            [tooltipId]="'objectives-' + code()"
            [count]="goal().objectivesCount"
            [names]="objectiveNames()"
          />
        </div>
        <span
          class="mt-0.5 inline-flex items-center gap-1 text-[11px] leading-[normal] font-bold transition-transform duration-200 [text-shadow:0_1px_4px_rgba(0,0,0,.45)] group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
        >
          View More
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
            class="h-[11px] w-[11px]"
          >
            <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  `,
})
export class StrategicGoalCard {
  readonly goal = input.required<StrategicGoalSummary>();
  readonly code = input.required<StrategicGoalCode>();
  readonly size = input.required<CardSize>();

  protected readonly routes = ROUTES;
  protected readonly fullTitle = computed(() => strategicGoalFullTitle(this.goal()));
  protected readonly ariaLabel = computed(() => {
    const count = this.goal().objectivesCount;
    return `${this.fullTitle()}. ${count} Objective${count === 1 ? '' : 's'}.`;
  });
  protected readonly tint = computed(() => STRATEGIC_GOAL_TINTS[this.code()]);
  protected readonly image = computed(() => strategicGoalImage(this.code()));
  protected readonly minHeight = computed(() => CARD_MIN_HEIGHT[this.size()]);
  protected readonly objectiveNames = computed(() => OBJECTIVE_SHORT_NAMES[this.code()] ?? []);
}
