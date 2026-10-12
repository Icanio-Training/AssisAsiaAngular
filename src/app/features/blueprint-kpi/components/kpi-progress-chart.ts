import { Component, computed, input, signal } from '@angular/core';

import { NO_DATA } from '../constants/strategic-goal-cards';
import type { DeepAnalysisChart } from '../models/blueprint-kpi.models';
import { buildSeries, niceScale, orderedPeriods } from '../utils/deep-analysis';

const W = 720;
const H = 320;
const PAD = { left: 40, right: 16, top: 16, bottom: 32 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

interface Point {
  x: number;
  y: number;
  v: number;
}

// Ported from React: components/KpiProgressChart.tsx — a hand-drawn SVG line/area chart
// (no chart library): one series per member state, legend toggles, hover highlighting.
@Component({
  selector: 'app-kpi-progress-chart',
  template: `
    @if (plot(); as plot) {
      <div>
        @if (chart().chartTitle) {
          <div class="mb-3 text-[13px] font-bold text-[#10192B]">{{ chart().chartTitle }}</div>
        }
        <div class="mb-4 flex flex-wrap gap-2">
          @for (s of plot.series; track s.code) {
            <button
              type="button"
              [attr.aria-pressed]="!hidden().has(s.code)"
              (click)="toggle(s.code)"
              (mouseenter)="hovered.set(s.code)"
              (mouseleave)="hovered.set(null)"
              class="inline-flex cursor-pointer items-center gap-[7px] rounded-full border border-[#ECEFF7] px-3 py-1.5 transition-colors hover:border-[#E3E8F2]"
              [class]="hidden().has(s.code) ? 'bg-[#F6F8FC] opacity-55' : 'bg-white'"
            >
              <span
                class="h-[9px] w-[9px] shrink-0 rounded-full"
                [style.background]="hidden().has(s.code) ? '#C1C5CB' : s.color"
              ></span>
              <span
                class="text-[12.5px] font-semibold whitespace-nowrap"
                [class]="hidden().has(s.code) ? 'text-[#94A0B8] line-through' : 'text-[#10192B]'"
              >
                {{ s.name }}
              </span>
            </button>
          }
        </div>

        <div
          class="relative w-full rounded-xl border border-[#ECEFF7] bg-[#F6F8FC] px-[18px] pt-[18px] pb-1.5"
        >
          <svg
            [attr.viewBox]="viewBox"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            [attr.aria-label]="chart().chartTitle ?? 'Progress over time'"
            class="block h-auto w-full overflow-visible"
          >
            @for (tick of plot.ticks; track tick.value) {
              <g>
                <line
                  [attr.x1]="pad.left"
                  [attr.x2]="width - pad.right"
                  [attr.y1]="tick.y"
                  [attr.y2]="tick.y"
                  stroke="#ECEFF7"
                  stroke-dasharray="3 3"
                />
                <text
                  [attr.x]="pad.left - 8"
                  [attr.y]="tick.y + 3"
                  text-anchor="end"
                  class="fill-[#94A0B8] text-[10px] font-medium"
                >
                  {{ tick.value }}
                </text>
              </g>
            }
            <line
              [attr.x1]="pad.left"
              [attr.x2]="width - pad.right"
              [attr.y1]="plot.baselineY"
              [attr.y2]="plot.baselineY"
              stroke="#E3E8F2"
            />
            @for (label of plot.xLabels; track label.year) {
              <text
                [attr.x]="label.x"
                [attr.y]="height - pad.bottom + 18"
                text-anchor="middle"
                class="fill-[#94A0B8] text-[10px] font-medium"
              >
                {{ label.year }}
              </text>
            }
            @for (s of plot.series; track s.code) {
              <g
                [attr.data-series]="s.code"
                (mouseenter)="hovered.set(s.code)"
                (mouseleave)="hovered.set(null)"
                class="transition-opacity duration-150"
                [class]="seriesClass(s.code)"
              >
                @if (s.area) {
                  <defs>
                    <linearGradient [attr.id]="s.gradientId" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" [attr.stop-color]="s.color" stop-opacity="0.16" />
                      <stop offset="100%" [attr.stop-color]="s.color" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path [attr.d]="s.area" [attr.fill]="'url(#' + s.gradientId + ')'" />
                }
                <polyline
                  [attr.points]="s.polyline"
                  fill="none"
                  [attr.stroke]="s.color"
                  [attr.stroke-width]="hovered() === s.code ? 3 : 2.25"
                />
                @for (p of s.points; track p.x) {
                  <circle
                    [attr.cx]="p.x"
                    [attr.cy]="p.y"
                    r="4"
                    [attr.fill]="s.color"
                    stroke="#FFFFFF"
                    stroke-width="1.5"
                  >
                    <title>{{ s.name }} — {{ p.v }}</title>
                  </circle>
                }
              </g>
            }
          </svg>
        </div>

        <div class="mt-[18px] overflow-x-auto rounded-xl border border-[#ECEFF7]">
          <table class="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th
                  class="border-b border-[#ECEFF7] bg-[#F6F8FC] px-4 py-3 text-left text-[10.5px] font-bold tracking-[0.04em] whitespace-nowrap text-[#94A0B8] uppercase"
                >
                  Member State
                </th>
                @for (label of plot.xLabels; track label.year) {
                  <th
                    class="border-b border-[#ECEFF7] bg-[#F6F8FC] px-4 py-3 text-right text-[10.5px] font-bold tracking-[0.04em] whitespace-nowrap text-[#94A0B8] uppercase"
                  >
                    {{ label.year }}
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (s of plot.series; track s.code) {
                <tr
                  [attr.data-series]="s.code"
                  (mouseenter)="hovered.set(s.code)"
                  (mouseleave)="hovered.set(null)"
                  class="[&:last-child>td]:border-b-0"
                  [class]="
                    (hidden().has(s.code) ? 'opacity-40 ' : '') +
                    (hovered() === s.code ? '[&>td]:bg-[#EEF3FC]' : '')
                  "
                >
                  <td
                    class="border-b border-[#ECEFF7] px-4 py-[11px] text-left font-semibold whitespace-nowrap text-[#10192B]"
                  >
                    <span
                      class="mr-[9px] inline-block h-2 w-2 rounded-full"
                      [style.background]="hidden().has(s.code) ? '#C1C5CB' : s.color"
                    ></span>
                    {{ s.name }}
                  </td>
                  @for (v of s.values; track $index) {
                    <td
                      class="border-b border-[#ECEFF7] px-4 py-[11px] text-right font-semibold whitespace-nowrap text-[#10192B] tabular-nums"
                    >
                      {{ v ?? '—' }}
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <p class="text-[13px] text-[#94A0B8] italic">{{ noData }}</p>
    }
  `,
})
export class KpiProgressChart {
  readonly chart = input.required<DeepAnalysisChart>();

  /** Member-state codes switched off in the legend. A new Set each time — signals compare by reference. */
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly hovered = signal<string | null>(null);

  protected readonly noData = NO_DATA;
  protected readonly width = W;
  protected readonly height = H;
  protected readonly pad = PAD;
  protected readonly viewBox = `0 0 ${W} ${H}`;

  // CONCEPT: computed() instead of ngOnChanges | REACT: useMemo(() => …, [chart]) | INTERVIEW: with @Input you'd recompute scales in ngOnChanges(changes) and check changes['chart']; a computed() re-runs automatically (and lazily) whenever chart() changes — no lifecycle hook, no SimpleChanges.
  // OLD: ngOnChanges(changes: SimpleChanges) { if (changes['chart']) this.plot = buildPlot(this.chart); }
  protected readonly plot = computed(() => {
    const chart = this.chart();
    const periods = orderedPeriods(chart);
    const series = buildSeries(periods);
    const numbers = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
    if (periods.length === 0 || numbers.length === 0) return null;

    const scale = niceScale(Math.min(...numbers), Math.max(...numbers));
    const xFor = (i: number) =>
      PAD.left + (periods.length > 1 ? (i * PLOT_W) / (periods.length - 1) : PLOT_W / 2);
    const yFor = (v: number) =>
      PAD.top + PLOT_H - ((v - scale.min) / (scale.max - scale.min)) * PLOT_H;
    const baselineY = yFor(Math.max(scale.min, 0));

    return {
      baselineY,
      ticks: scale.ticks.map((value) => ({ value, y: yFor(value) })),
      xLabels: periods.map((period, i) => ({ year: period.year, x: xFor(i) })),
      series: series.map((s) => {
        const points = s.values.flatMap((v, i): Point[] =>
          v === null ? [] : [{ x: xFor(i), y: yFor(v), v }],
        );
        const first = points[0];
        const last = points[points.length - 1];
        const area =
          first && last && points.length > 1
            ? `M${first.x},${baselineY} ${points.map((p) => `L${p.x},${p.y}`).join(' ')} L${last.x},${baselineY} Z`
            : null;
        return {
          ...s,
          points,
          area,
          polyline: points.map((p) => `${p.x},${p.y}`).join(' '),
          gradientId: `kpi-progress-${chart.id ?? 'new'}-${s.code}`,
        };
      }),
    };
  });

  protected toggle(code: string): void {
    this.hidden.update((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  protected seriesClass(code: string): string {
    if (this.hidden().has(code)) return 'pointer-events-none opacity-0';
    const hovered = this.hovered();
    return hovered !== null && hovered !== code ? 'opacity-25' : '';
  }
}
