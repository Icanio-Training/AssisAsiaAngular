import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { ARIAL_MEDIUM, hasValue, NO_DATA } from '../constants/strategic-goal-cards';
import type { StrategicMeasure } from '../models/blueprint-kpi.models';
import { KpiRow } from './kpi-row';

// Ported from React: StrategicMeasureCard in components/StrategicGoalPanel.tsx
@Component({
  selector: 'app-strategic-measure-card',
  imports: [KpiRow],
  template: `
    <div
      class="overflow-hidden rounded-lg border border-[#E3E8F2] bg-white transition-[box-shadow,border-color] duration-200 hover:border-[var(--accent)] hover:shadow-scd-xs"
    >
      <div class="px-3.5 pt-[13px] pb-1">
        <span
          class="inline-block rounded-[7px] bg-[var(--accent-light)] px-2 py-1 text-[10.5px] leading-[normal] font-bold text-[var(--accent)]"
        >
          {{ measure().code }}
        </span>
        <p
          class="mt-2 line-clamp-2 text-[12.5px] leading-[1.5] text-[#10192B]"
          [class]="arialMedium"
        >
          {{ description() }}
        </p>
      </div>
      <div class="flex items-center justify-between gap-2.5 px-3.5 pt-2.5 pb-[13px]">
        <span
          class="max-w-[45%] truncate text-[10.5px] leading-[normal] font-bold tracking-[0.03em] text-[#94A0B8] uppercase"
        >
          {{ leadSb() }}
        </span>
        <button
          type="button"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-controls]="listId()"
          (click)="toggle()"
          class="inline-flex shrink-0 cursor-pointer items-center gap-[7px] px-0.5 py-1 text-[11.5px] leading-[normal] font-bold text-[var(--accent-text)]"
        >
          <span>{{ isOpen() ? 'View Less' : 'View More' }}</span>
          <span class="font-semibold text-[#94A0B8]">
            {{ measure().kpiCount }} SM KPI{{ measure().kpiCount === 1 ? '' : 's' }}
          </span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
            class="h-[11px] w-[11px] transition-transform duration-200"
            [class.rotate-180]="isOpen()"
          >
            <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
      <!-- 0fr → 1fr grid-rows animates height without measuring content. -->
      <div
        [id]="listId()"
        [attr.aria-hidden]="!isOpen()"
        class="grid transition-[grid-template-rows] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        [class]="isOpen() ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <div class="overflow-hidden">
          <div class="flex flex-col gap-1.5 px-3 pb-3">
            @for (kpi of measure().kpis; track kpi.deepAnalysisId ?? kpi.kpiDetailId ?? $index) {
              <app-kpi-row
                [kpi]="kpi"
                [isListOpen]="isOpen()"
                [selectedKpiId]="selectedKpiId()"
                (selectKpi)="selectKpi.emit($event)"
              />
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StrategicMeasureCard {
  readonly measure = input.required<StrategicMeasure>();
  readonly selectedKpiId = input<number | null>(null);
  readonly selectKpi = output<number>();

  private readonly holdsSelectedKpi = computed(() => {
    const selected = this.selectedKpiId();
    return selected !== null && this.measure().kpis.some((kpi) => kpi.deepAnalysisId === selected);
  });

  // CONCEPT: linkedSignal (writable state that resets from a source) | REACT: useState(() => initial) + a useEffect to re-sync | INTERVIEW: the user can toggle it with set(), but when the source changes (a deep link / another KPI selected) it re-derives — here it opens to reveal the selected KPI and otherwise keeps the user's choice.
  protected readonly isOpen = linkedSignal<boolean, boolean>({
    source: this.holdsSelectedKpi,
    computation: (holdsSelected, previous) => holdsSelected || (previous?.value ?? false),
  });

  protected readonly arialMedium = ARIAL_MEDIUM;
  protected readonly listId = computed(() => `sm-kpis-${this.measure().id}`);
  protected readonly description = computed(() => {
    const text = this.measure().description;
    return hasValue(text) ? text : NO_DATA;
  });
  protected readonly leadSb = computed(() => {
    const text = this.measure().leadSb;
    return hasValue(text) ? text : NO_DATA;
  });

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }
}
