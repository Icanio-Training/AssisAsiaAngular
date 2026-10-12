import { Component, computed, input, output } from '@angular/core';

import { goalAccentStyle, strategicGoalFullTitle } from '../constants/strategic-goal-cards';
import type { StrategicGoalDetail } from '../models/blueprint-kpi.models';
import { ObjectiveGroup } from './objective-group';

// Ported from React: components/StrategicGoalPanel.tsx (StatBox inlined as an @for).
@Component({
  selector: 'app-strategic-goal-panel',
  imports: [ObjectiveGroup],
  template: `
    <section
      aria-label="Strategic Goal details"
      [style]="accentStyle()"
      class="overflow-hidden rounded-2xl border border-[#ECEFF7] bg-white shadow-scd-md before:block before:h-[5px] before:w-full before:bg-[linear-gradient(90deg,#2C59A7,#FBF315,#C73935)] before:opacity-90"
    >
      <div
        class="border-b border-[#E3E8F2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F6F8FC_140%)] px-5 py-[22px] md:px-[34px] md:pt-8 md:pb-[26px]"
      >
        <span
          class="mb-2.5 inline-flex items-center rounded-[100px] bg-[#EEF3FC] px-3 py-[5px] text-[10px] leading-[normal] font-bold tracking-[0.14em] text-[#2C59A7] uppercase"
        >
          SM KPI Analysis
        </span>
        <h2 class="mt-[5px] text-[22px] leading-[1.3] font-bold tracking-[-0.01em] text-[#10192B]">
          {{ fullTitle() }}
        </h2>
      </div>

      <div
        class="grid grid-cols-2 gap-4 border-b border-[#E3E8F2] px-5 py-[18px] md:px-[34px] md:py-[26px]"
      >
        @for (stat of stats(); track stat.label) {
          <div
            class="relative overflow-hidden rounded-xl border border-[#ECEFF7] bg-[#F6F8FC] px-5 py-6 text-center transition-[border-color,transform,box-shadow] duration-200 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[var(--accent)] before:opacity-0 before:transition-opacity hover:-translate-y-[3px] hover:border-[var(--accent)] hover:shadow-scd-sm hover:before:opacity-100"
          >
            <div
              class="text-[34px] leading-[1.3] font-extrabold tracking-[-0.015em] text-[#10192B]"
            >
              {{ stat.value }}
            </div>
            <div
              class="mt-[7px] text-[10.5px] leading-[normal] font-bold tracking-[0.06em] text-[#94A0B8] uppercase"
            >
              {{ stat.label }}
            </div>
          </div>
        }
      </div>

      <div class="px-5 pt-5 pb-6 md:px-[34px] md:pt-[30px] md:pb-[34px]">
        <h3
          class="mb-[18px] flex items-center gap-2.5 text-[15px] leading-[normal] font-bold text-[#10192B] before:inline-block before:h-4 before:w-1 before:rounded-[3px] before:bg-[var(--accent)]"
        >
          Objectives &amp; SM KPIs
        </h3>
        <!-- Narrowed to 42% / 560px beside the detail view, the 420px auto-fit floor would
             overflow, so force one column whenever a KPI is open. -->
        <div
          class="grid grid-cols-1 items-start gap-[18px]"
          [class]="
            selectedKpiId() === null ? 'md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]' : ''
          "
        >
          @for (objective of goal().objectives; track objective.id) {
            <app-objective-group
              [objective]="objective"
              [isHighlighted]="objective.id === highlightObjectiveId()"
              [selectedKpiId]="selectedKpiId()"
              (selectKpi)="selectKpi.emit($event)"
            />
          }
        </div>
      </div>
    </section>
  `,
})
export class StrategicGoalPanel {
  readonly goal = input.required<StrategicGoalDetail>();
  /** deepAnalysisId of the KPI open in the detail view, if any. */
  readonly selectedKpiId = input<number | null>(null);
  /** Objective to scroll to and flash (set briefly after Close). */
  readonly highlightObjectiveId = input<number | null>(null);
  readonly selectKpi = output<number>();

  protected readonly accentStyle = computed(() => goalAccentStyle(this.goal().code));
  protected readonly fullTitle = computed(() => strategicGoalFullTitle(this.goal()));
  protected readonly stats = computed(() => [
    { value: this.goal().objectivesCount, label: 'Objectives' },
    { value: this.goal().strategicMeasuresCount, label: 'Strategic Measures' },
  ]);
}
