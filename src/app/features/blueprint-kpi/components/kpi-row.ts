import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import { ARIAL_MEDIUM, hasValue, NO_DATA } from '../constants/strategic-goal-cards';
import type { StrategicMeasureKpi } from '../models/blueprint-kpi.models';

const BASE =
  'group/kpi flex items-center gap-2.5 rounded-lg border bg-[#F6F8FC] px-3 py-2.5 transition-[border-color,transform] duration-200 hover:translate-x-0.5 hover:border-[var(--accent)]';

// Ported from React: KpiRow in components/StrategicGoalPanel.tsx
@Component({
  selector: 'app-kpi-row',
  template: `
    <ng-template #content>
      <span
        class="shrink-0 rounded-md bg-[var(--accent-light)] px-[7px] py-[3px] text-[10px] leading-[normal] font-bold whitespace-nowrap text-[var(--accent)]"
      >
        {{ kpi().code ?? '—' }}
      </span>
      <span class="min-w-0 flex-1 text-[12px] leading-[1.4] text-[#10192B]" [class]="arialMedium">
        {{ description() }}
      </span>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
        class="h-3 w-3 shrink-0 text-[#94A0B8] group-hover/kpi:text-[var(--accent-text)]"
      >
        <path d="M6 3l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </ng-template>

    @if (kpi().deepAnalysisId === null) {
      <!-- A KPI without a deep analysis has nothing to open. -->
      <div [class]="base + ' border-[#ECEFF7]'">
        <ng-container [ngTemplateOutlet]="content" />
      </div>
    } @else {
      <div
        role="button"
        [attr.tabindex]="isListOpen() ? 0 : -1"
        [attr.aria-label]="(kpi().code ?? '') + ': ' + (kpi().description ?? noData)"
        [attr.aria-current]="isSelected() ? 'true' : null"
        (click)="open()"
        (keydown.enter)="onKey($event)"
        (keydown.space)="onKey($event)"
        class="cursor-pointer focus-visible:translate-x-0.5 focus-visible:border-[var(--accent)] focus-visible:outline-none"
        [class]="base + (isSelected() ? ' border-[var(--accent)] bg-white' : ' border-[#ECEFF7]')"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </div>
    }
  `,
  imports: [NgTemplateOutlet],
})
export class KpiRow {
  readonly kpi = input.required<StrategicMeasureKpi>();
  /** Rows inside a collapsed list are taken out of the tab order. */
  readonly isListOpen = input(false);
  readonly selectedKpiId = input<number | null>(null);

  // CONCEPT: output() | REACT: an onSelectKpi callback prop | INTERVIEW: the child emits an event, the parent decides what it means (here: navigate to ?kpi=).
  readonly selectKpi = output<number>();

  protected readonly base = BASE;
  protected readonly arialMedium = ARIAL_MEDIUM;
  protected readonly noData = NO_DATA;
  protected readonly description = computed(() => {
    const text = this.kpi().description;
    return hasValue(text) ? text : NO_DATA;
  });
  protected readonly isSelected = computed(
    () => this.kpi().deepAnalysisId !== null && this.kpi().deepAnalysisId === this.selectedKpiId(),
  );

  protected open(): void {
    const id = this.kpi().deepAnalysisId;
    if (id !== null) this.selectKpi.emit(id);
  }

  protected onKey(event: Event): void {
    event.preventDefault();
    this.open();
  }
}
