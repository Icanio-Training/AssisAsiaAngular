import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ChartCard } from '@shared/ui/chart-card';

import { OUTCOME_CHART_IDS } from '../constants/outcome-documents.constants';
import type { OutcomeChartsResponse } from '../models/outcome-documents.models';
import { AMS_BAR_GRIDLINE_PCTS, buildAxisTicks, sortByCountDesc } from '../utils/ams-bar-chart';
import type { ChartLoadStatus } from './chart-load-status';

/** Horizontal ranking bar per AMS, highest → lowest, with a shared axis row.
    Built from divs (not a canvas), so ChartCard hides its PNG download button here. */
@Component({
  selector: 'app-ams-bar-ranking-section',
  imports: [ChartCard, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-chart-card
      [title]="
        ranking()?.title ?? 'Current Status of Follow-Up Actions to the ASCC Outcome Documents'
      "
      [subtitle]="ranking()?.asOf ?? ''"
      [chartId]="chartId"
      filename="Current_Status_of_Follow_Up_Actions"
      bodyClass="overflow-x-auto px-6 pt-[18px] pb-[22px]"
    >
      @switch (status()) {
        @case ('loading') {
          <div role="status" aria-label="Loading ranking chart" class="space-y-1.5">
            @for (i of skeletonRows; track i) {
              <div class="h-[18px] w-full animate-pulse rounded-full bg-[#E2E8F0]"></div>
            }
          </div>
        }
        @case ('error') {
          <p
            role="alert"
            class="rounded-lg border border-asean-red/30 bg-red-50 p-4 text-sm text-asean-red"
          >
            Could not load the chart data. Please try again later.
          </p>
        }
        @default {
          @if (sorted().length === 0) {
            <p class="py-14 text-center text-sm text-gray-400">No data matches current filters</p>
          } @else {
            <div class="min-w-[560px]">
              <div class="flex min-w-[560px] flex-col gap-[5px]">
                @for (item of sorted(); track item.code) {
                  <button
                    type="button"
                    (click)="drill.emit(item.code)"
                    class="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-[5px] text-left transition-colors hover:bg-[#F8FAFC]"
                  >
                    <span
                      [title]="item.country"
                      class="w-[130px] shrink-0 truncate text-right text-xs font-semibold text-[#374151]"
                    >
                      {{ item.country }}
                    </span>
                    <span
                      class="relative mr-[60px] h-[18px] min-w-[120px] flex-1 rounded-full bg-[#F1F5F9]"
                    >
                      @for (p of gridlines; track p) {
                        <span
                          aria-hidden="true"
                          class="absolute -top-1 -bottom-1 w-px bg-[#94A3B8]/30"
                          [style.left.%]="p"
                        ></span>
                      }
                      <span
                        class="absolute top-0 left-0 h-full rounded-full bg-[linear-gradient(90deg,#1A3A6B_0%,#2C59A7_55%,#4A7ED4_100%)] shadow-[0_1px_3px_rgba(44,89,167,0.35)] transition-[width] duration-[800ms] group-hover:brightness-110"
                        [style.width.%]="pct(item.count)"
                      ></span>
                      <span
                        class="absolute top-1/2 ml-2.5 -translate-y-1/2 rounded-full bg-[#EEF2FB] px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-[#1A3A6B] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors group-hover:bg-[#2C59A7] group-hover:text-white"
                        [style.left.%]="pct(item.count)"
                      >
                        {{ item.count | number }}
                      </span>
                    </span>
                  </button>
                }
              </div>

              <div class="mt-1.5 flex min-w-[560px] gap-3 border-t border-[#E2E8F0] px-2 pt-1.5">
                <span class="w-[130px] shrink-0"></span>
                <span class="relative mr-[60px] h-3.5 min-w-[120px] flex-1">
                  @for (t of ticks(); track t.pct) {
                    <span
                      class="absolute top-0 text-[10px] text-[#94A3B8]"
                      [style.left.%]="t.pct"
                      [style.transform]="t.transform"
                    >
                      {{ t.val | number }}
                    </span>
                  }
                </span>
              </div>
              <div class="mt-1 flex min-w-[560px] gap-3 px-2">
                <span class="w-[130px] shrink-0"></span>
                <span
                  class="mr-[60px] flex-1 text-center text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase"
                >
                  Initiative Count
                </span>
              </div>
            </div>
          }
        }
      }
    </app-chart-card>
  `,
})
export class AmsBarRankingSection {
  readonly charts = input<OutcomeChartsResponse | undefined>();
  readonly status = input.required<ChartLoadStatus>();
  /** Emits the clicked country's code. */
  readonly drill = output<string>();

  protected readonly chartId = OUTCOME_CHART_IDS.currentStatusOfFollowUpActionsByCountry;
  protected readonly gridlines = AMS_BAR_GRIDLINE_PCTS;
  protected readonly skeletonRows = Array.from({ length: 10 }, (_, i) => i);

  protected readonly ranking = computed(
    () => this.charts()?.currentStatusOfFollowUpActionsByCountry,
  );
  protected readonly sorted = computed(() => sortByCountDesc(this.ranking()?.items ?? []));
  private readonly maxVal = computed(() =>
    this.sorted().reduce((max, i) => Math.max(max, i.count), 0),
  );
  protected readonly ticks = computed(() => buildAxisTicks(this.maxVal()));

  protected pct(count: number): number {
    const max = this.maxVal();
    return max > 0 ? (count / max) * 100 : 0;
  }
}
