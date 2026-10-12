import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ChartCard } from '@shared/ui/chart-card';

import { OUTCOME_CHART_IDS } from '../constants/outcome-documents.constants';
import type { OutcomeChartsResponse } from '../models/outcome-documents.models';
import {
  flagFor,
  sortByCountDesc,
  VBAR_TRACK_HEIGHT,
  vbarGradientFor,
  vbarHeightFor,
} from '../utils/ams-bar-chart';
import type { ChartLoadStatus } from './chart-load-status';

/** Vertical gradient bars per AMS with a flag watermark (same data as the ranking chart). */
// CONCEPT: [ngStyle] | REACT: style={ { height, background } } | INTERVIEW: sets several inline styles from one object; prefer [style.x] for a single property.
@Component({
  selector: 'app-ams-member-states-section',
  imports: [ChartCard, NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-chart-card
      [title]="
        charts()?.followUpActionsAcrossMemberStates?.title ??
        'Follow-Up Actions Across ASEAN Member States per Outcome Documents'
      "
      [subtitle]="charts()?.followUpActionsAcrossMemberStates?.asOf ?? ''"
      [chartId]="chartId"
      filename="Follow_Up_Actions_Across_Member_States"
      bodyClass="overflow-x-auto p-5"
    >
      @switch (status()) {
        @case ('loading') {
          <div
            role="status"
            aria-label="Loading member state bars"
            class="flex items-end justify-center gap-3.5"
            [style.height.px]="trackHeight"
          >
            @for (i of skeletonBars; track i) {
              <div class="h-full w-[84px] animate-pulse rounded-[14px] bg-[#E2E8F0]"></div>
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
          @if (bars().length === 0) {
            <p class="py-14 text-center text-sm text-gray-400">No data matches current filters</p>
          } @else {
            <div
              class="mx-auto flex min-w-max items-end justify-center gap-3.5 px-1"
              [style.height.px]="trackHeight"
            >
              @for (bar of bars(); track bar.code; let first = $first) {
                <div class="relative h-full w-[84px] shrink-0">
                  <div
                    aria-hidden="true"
                    class="absolute inset-0 rounded-[14px] bg-[#F4F5F7]"
                  ></div>
                  <button
                    type="button"
                    (click)="drill.emit(bar.code)"
                    class="absolute inset-x-0 bottom-0 flex cursor-pointer flex-col items-center overflow-hidden rounded-[14px] px-1.5 pt-2.5 text-center shadow-[0_6px_16px_-8px_rgba(15,23,42,0.35)] transition-shadow hover:shadow-[0_6px_16px_-8px_rgba(15,23,42,0.35),0_0_0_3px_#2C59A7]"
                    [ngStyle]="{ height: bar.height + 'px', background: bar.gradient }"
                  >
                    @if (bar.flag) {
                      <span
                        aria-hidden="true"
                        class="absolute inset-x-0 bottom-0 z-0 h-[min(160px,100%)] bg-auto bg-center bg-no-repeat opacity-30 brightness-[1.05] contrast-[1.3]"
                        [style.background-image]="'url(' + bar.flag + ')'"
                      ></span>
                    }
                    <span class="relative z-[1] flex flex-1 flex-col items-center">
                      <span
                        class="line-clamp-2 text-xs font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.35)]"
                      >
                        {{ bar.country }}
                      </span>
                      <span
                        class="mt-0.5 text-[27px] leading-[1.15] font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.35)]"
                      >
                        {{ bar.count }}
                      </span>
                      <span
                        class="mt-[3px] text-[10px] text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,.3)]"
                      >
                        Initiatives
                      </span>
                      @if (first) {
                        <span
                          class="mt-1.5 flex items-center gap-0.5 text-[11px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,.3)]"
                        >
                          View More
                          <span class="material-symbols-outlined text-[12px]" aria-hidden="true"
                            >chevron_right</span
                          >
                        </span>
                      }
                    </span>
                  </button>
                </div>
              }
            </div>
          }
        }
      }
    </app-chart-card>
  `,
})
export class AmsMemberStatesSection {
  readonly charts = input<OutcomeChartsResponse | undefined>();
  readonly status = input.required<ChartLoadStatus>();
  /** Emits the clicked country's code. */
  readonly drill = output<string>();

  protected readonly chartId = OUTCOME_CHART_IDS.followUpActionsAcrossMemberStates;
  protected readonly trackHeight = VBAR_TRACK_HEIGHT;
  protected readonly skeletonBars = Array.from({ length: 10 }, (_, i) => i);

  protected readonly bars = computed(() => {
    const items = sortByCountDesc(
      this.charts()?.currentStatusOfFollowUpActionsByCountry.items ?? [],
    );
    const maxVal = items.reduce((max, i) => Math.max(max, i.count), 0);
    return items.map((item) => ({
      ...item,
      height: vbarHeightFor(item.count, maxVal),
      gradient: vbarGradientFor(item.code),
      flag: flagFor(item.code),
    }));
  });
}
