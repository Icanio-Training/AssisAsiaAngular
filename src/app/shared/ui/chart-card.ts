import { ChangeDetectionStrategy, Component, contentChild, input } from '@angular/core';

import { saveDataUrl } from '@shared/utils/download';

import { ChartComponent } from './chart';

// CONCEPT: content projection + contentChild() | REACT: <ChartCard>{children}</ChartCard> | INTERVIEW: <ng-content> renders whatever the parent puts inside the tag; contentChild() lets the card reach the projected <app-chart> to export it as PNG.
// Usage:
//   <app-chart-card title="Activities per period" chartId="activities-per-period" filename="activities">
//     <app-chart type="bar" [data]="data()" />
//   </app-chart-card>
@Component({
  selector: 'app-chart-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      class="chart-card overflow-hidden rounded-xl border border-[#E2E8F0] bg-white transition-shadow duration-200"
      [class.scroll-mt-[120px]]="!!chartId()"
      [attr.id]="chartId() ? chartId() + '-card' : null"
      [attr.aria-label]="title()"
    >
      <header
        class="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-6 pt-6 pb-4"
      >
        <div class="min-w-0">
          <h3 class="text-[15px] font-semibold tracking-[-0.01em] text-[#1A3A6B]">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="mt-0.5 text-xs text-[#64748B]">{{ subtitle() }}</p>
          }
        </div>
        @if (downloadable() && chart()) {
          <button
            type="button"
            (click)="download()"
            aria-label="Download chart image"
            title="Download chart image"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-primary-600 transition-colors hover:border-primary-600 hover:bg-[#EEF3FC]"
          >
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
          </button>
        }
      </header>
      <div [class]="bodyClass()">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    .chart-card {
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.06),
        0 6px 16px -8px rgba(15, 23, 42, 0.08);
    }
    .chart-card:hover {
      box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.08),
        0 12px 32px -12px rgba(15, 23, 42, 0.12);
    }
  `,
})
export class ChartCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  /** DOM id prefix (`<id>-card`) — used to scroll back to this chart after a drill-down. */
  readonly chartId = input<string>('');
  readonly filename = input<string>('chart');
  /** e.g. false for the guest role (React: hideDownload). */
  readonly downloadable = input(true);
  readonly bodyClass = input('p-6');

  protected readonly chart = contentChild(ChartComponent);

  protected download(): void {
    const dataUrl = this.chart()?.toBase64Image();
    if (dataUrl) saveDataUrl(dataUrl, `${this.filename()}.png`);
  }
}
