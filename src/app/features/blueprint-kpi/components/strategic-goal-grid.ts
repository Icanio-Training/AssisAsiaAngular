import { Component, computed, input } from '@angular/core';

import { CARD_LAYOUT, EXPLORE_TITLE } from '../constants/strategic-goal-cards';
import type { StrategicGoalSummary } from '../models/blueprint-kpi.models';
import { StrategicGoalCard } from './strategic-goal-card';

/* Explicit lg placement so the centre title (cols 2–5, same row) overlaps the column gap
   instead of pushing the six columns onto a second row. Full class strings (not built with
   string concatenation) so Tailwind's scanner can see them. */
const LG_COLUMN_CLASSES = [
  'lg:col-start-1',
  'lg:col-start-2',
  'lg:col-start-3',
  'lg:col-start-4',
  'lg:col-start-5',
  'lg:col-start-6',
];

// Ported from React: components/StrategicGoalGrid.tsx
@Component({
  selector: 'app-strategic-goal-grid',
  imports: [StrategicGoalCard],
  template: `
    <section class="flex w-full items-center justify-center px-11 py-[clamp(16px,3vw,32px)]">
      <div
        class="relative w-full max-w-[1200px] overflow-hidden rounded-2xl border border-[#ECEFF7] bg-white p-[clamp(14px,2.4vw,26px)] shadow-scd-md before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[linear-gradient(90deg,#2C59A7,#FBF315,#C73935)] before:opacity-90"
      >
        <div
          class="relative mt-1 mb-0.5 grid w-full grid-cols-2 gap-x-[clamp(10px,1.5vw,18px)] gap-y-[clamp(10px,1.5vw,18px)] md:grid-cols-3 lg:grid-cols-6 lg:gap-y-0"
        >
          @for (column of columns(); track column.key) {
            <div
              class="flex min-w-0 flex-col justify-between gap-3 lg:row-start-1 lg:h-full"
              [class]="column.lgClass"
            >
              @for (cell of column.cells; track cell.code) {
                <app-strategic-goal-card
                  [goal]="cell.goal"
                  [code]="cell.code"
                  [size]="column.size"
                />
              }
            </div>
          }
          <div
            class="col-span-full self-center justify-self-center px-3 pt-2.5 text-center lg:col-span-4 lg:col-start-2 lg:row-start-1 lg:max-w-[480px] lg:pt-0"
          >
            <h3
              class="text-[clamp(16px,1.9vw,22px)] leading-[1.25] font-bold tracking-[-0.01em] text-[#10192B]"
            >
              {{ title }}
            </h3>
          </div>
        </div>
        <p class="mt-2.5 text-center text-[12px] leading-[normal] text-[#94A0B8]">
          Tap a card to view its Objectives and SM KPIs
        </p>
      </div>
    </section>
  `,
})
export class StrategicGoalGrid {
  readonly goals = input<readonly StrategicGoalSummary[]>([]);

  protected readonly title = EXPLORE_TITLE;

  /** CARD_LAYOUT joined with the API cards; a code the API didn't return is skipped. */
  protected readonly columns = computed(() => {
    const byCode = new Map(this.goals().map((goal) => [goal.code, goal]));
    return CARD_LAYOUT.map((column, index) => ({
      key: column.top,
      size: column.size,
      lgClass: LG_COLUMN_CLASSES[index] ?? '',
      cells: [column.top, column.bottom].flatMap((code) => {
        const goal = byCode.get(code);
        return goal ? [{ code, goal }] : [];
      }),
    }));
  });
}
