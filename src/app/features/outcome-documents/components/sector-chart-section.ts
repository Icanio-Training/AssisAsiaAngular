import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';

import { ChartComponent, type ChartClickEvent } from '@shared/ui/chart';
import { ChartCard } from '@shared/ui/chart-card';

import { OUTCOME_CHART_IDS } from '../constants/outcome-documents.constants';
import type { OutcomeChartsResponse } from '../models/outcome-documents.models';
import { buildSectorSlices, dimmed, shortSectorName } from '../utils/sector-donut';
import type { ChartLoadStatus } from './chart-load-status';

/** Sector donut + legend table. Hovering a slice highlights its legend row and vice versa. */
// CONCEPT: [ngClass] with an object | REACT: template-literal className with ternaries | INTERVIEW: each key is a class list, applied while its value is truthy.
@Component({
  selector: 'app-sector-chart-section',
  imports: [ChartCard, ChartComponent, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-chart-card
      [title]="sectors()?.title ?? 'Follow-Up Actions Across Sectors'"
      [subtitle]="sectors()?.subtitle ?? 'Number of distinct declarations mapped to each sector'"
      [chartId]="chartId"
      filename="Follow_Up_Actions_Across_Sectors"
      [downloadable]="downloadable()"
      bodyClass="p-0"
    >
      @switch (status()) {
        @case ('loading') {
          <div
            role="status"
            aria-label="Loading sector chart"
            class="flex min-h-[420px] items-stretch"
          >
            <div class="flex flex-none items-center justify-center py-6 pr-5 pl-6">
              <div class="h-[260px] w-[260px] animate-pulse rounded-full bg-[#E2E8F0]"></div>
            </div>
            <div
              class="flex flex-1 flex-col justify-center gap-3 border-l border-[#E2E8F0] py-6 pr-6 pl-3"
            >
              @for (i of skeletonRows; track i) {
                <div class="h-5 w-full animate-pulse rounded bg-[#E2E8F0]"></div>
              }
            </div>
          </div>
        }
        @case ('error') {
          <p
            role="alert"
            class="m-6 rounded-lg border border-asean-red/30 bg-red-50 p-4 text-sm text-asean-red"
          >
            Could not load the chart data. Please try again later.
          </p>
        }
        @default {
          @if (slices().length === 0) {
            <p class="py-14 text-center text-sm text-gray-400">No data matches current filters</p>
          } @else {
            <div
              class="flex min-h-[420px] flex-wrap items-stretch md:flex-nowrap"
              (mouseleave)="hovered.set(null)"
            >
              <div class="relative z-10 flex flex-none items-center justify-center py-6 pr-5 pl-6">
                <div class="relative mx-auto h-[260px] w-[300px]">
                  <app-chart
                    class="h-full w-full"
                    type="doughnut"
                    ariaLabel="Follow-up actions across sectors"
                    [data]="donutData()"
                    [options]="donutOptions"
                    (chartClick)="onSliceClick($event)"
                  />
                  <div
                    class="pointer-events-none absolute top-1/2 left-1/2 w-[160px] -translate-x-1/2 -translate-y-1/2 text-center"
                  >
                    @if (hoveredSlice(); as slice) {
                      <div class="text-xs leading-[1.3] font-bold" [style.color]="slice.color">
                        {{ shortName(slice.sector) }}
                      </div>
                      <div
                        class="mt-1 text-[40px] leading-none font-bold"
                        [style.color]="slice.color"
                      >
                        {{ slice.count }}
                      </div>
                      <div class="mt-[5px] text-[11px]" [style.color]="slice.color">
                        {{ slice.share }}% of Total
                      </div>
                    } @else {
                      <div
                        class="text-[11px] leading-[1.4] font-bold tracking-[0.09em] text-gray-400 uppercase"
                      >
                        Total Declarations
                      </div>
                      <div class="mt-1 text-[44px] leading-none font-bold text-[#1A3A6B]">
                        {{ total() }}
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div
                class="relative z-0 flex min-w-0 flex-1 flex-col justify-center border-l border-[#E2E8F0] py-6 pr-6 pl-3"
              >
                <div
                  class="mb-1 grid grid-cols-[14px_1fr_48px_52px] items-center gap-2 border-b-2 border-primary-600 px-2 pb-2 text-[9px] font-bold tracking-[0.07em] text-primary-600 uppercase"
                >
                  <span></span>
                  <span>Sector</span>
                  <span class="text-right">Decl.</span>
                  <span class="text-right">Share</span>
                </div>
                @for (slice of slices(); track slice.sector; let i = $index) {
                  <button
                    type="button"
                    class="grid w-full cursor-pointer grid-cols-[14px_1fr_48px_52px] items-center gap-2 border-b border-[#F5F7FB] px-2 py-[7px] text-left transition-colors"
                    [ngClass]="{ 'bg-[#F0F5FF]': hovered() === i }"
                    (mouseenter)="hovered.set(i)"
                    (focus)="hovered.set(i)"
                    (click)="drillTo(i)"
                  >
                    <span
                      class="h-3 w-3 rounded-full transition-transform"
                      [ngClass]="{ 'scale-125': hovered() === i, 'opacity-30': isDimmed(i) }"
                      [style.background-color]="slice.color"
                      aria-hidden="true"
                    ></span>
                    <span
                      [title]="slice.sector"
                      class="truncate text-xs"
                      [ngClass]="{
                        'font-bold text-[#1A3A6B]': hovered() === i,
                        'text-[#C0C8D8]': isDimmed(i),
                        'text-gray-700': hovered() === null,
                      }"
                    >
                      {{ shortName(slice.sector) }}
                    </span>
                    <span
                      class="text-right text-xs font-bold"
                      [ngClass]="isDimmed(i) ? 'text-[#C0C8D8]' : 'text-[#1A3A6B]'"
                    >
                      {{ slice.count }}
                    </span>
                    <span
                      class="text-right text-[11px]"
                      [ngClass]="isDimmed(i) ? 'text-[#C0C8D8]' : 'text-gray-500'"
                    >
                      {{ slice.share }}%
                    </span>
                  </button>
                }
              </div>
            </div>
          }
        }
      }
    </app-chart-card>
  `,
})
export class SectorChartSection {
  readonly charts = input<OutcomeChartsResponse | undefined>();
  readonly status = input.required<ChartLoadStatus>();
  /** false for the guest role (PNG download hidden). */
  readonly downloadable = input(true);
  /** Emits the clicked sector's full name. */
  readonly drill = output<string>();

  protected readonly chartId = OUTCOME_CHART_IDS.followUpActionsAcrossSectors;
  protected readonly skeletonRows = Array.from({ length: 12 }, (_, i) => i);
  protected readonly shortName = shortSectorName;

  /** The single source of truth for hover — shared by the donut and the legend. */
  protected readonly hovered = signal<number | null>(null);

  protected readonly sectors = computed(() => this.charts()?.followUpActionsAcrossSectors);
  protected readonly slices = computed(() => buildSectorSlices(this.sectors()?.items ?? []));
  protected readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.count, 0));
  protected readonly hoveredSlice = computed(() => {
    const index = this.hovered();
    return index === null ? undefined : this.slices()[index];
  });

  // Re-computed on hover, so the chart wrapper's effect() redraws with dimmed colors.
  protected readonly donutData = computed<ChartData>(() => {
    const hovered = this.hovered();
    return {
      labels: this.slices().map((s) => s.sector),
      datasets: [
        {
          data: this.slices().map((s) => s.count),
          backgroundColor: this.slices().map((s, i) =>
            hovered !== null && hovered !== i ? dimmed(s.color) : s.color,
          ),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  });

  protected readonly donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    // Slice → legend sync: Chart.js reports the hovered arc; we store its index in the signal.
    onHover: (_event, elements) => this.hovered.set(elements[0]?.index ?? null),
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const slice = this.slices()[ctx.dataIndex];
            return slice ? [`Declarations: ${slice.count}`, `Share: ${slice.share}%`] : '';
          },
        },
      },
    },
  };

  protected isDimmed(index: number): boolean {
    const hovered = this.hovered();
    return hovered !== null && hovered !== index;
  }

  protected onSliceClick(event: ChartClickEvent): void {
    this.drillTo(event.index);
  }

  protected drillTo(index: number): void {
    const sector = this.slices()[index]?.sector;
    if (sector) this.drill.emit(sector);
  }
}
