import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  inject,
  input,
  NgZone,
  type OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import {
  Chart,
  type ChartData,
  type ChartOptions,
  type ChartType,
  type Plugin,
  registerables,
} from 'chart.js';

// Register every Chart.js controller/scale once. (Perf note: registering only the pieces you
// use — e.g. BarController, ArcElement — shrinks the bundle; see M7 in INTERVIEW_GUIDE.md.)
Chart.register(...registerables);

export interface ChartClickEvent {
  /** Index of the clicked bar / slice / point within its dataset. */
  readonly index: number;
  readonly datasetIndex: number;
}

// CONCEPT: wrapping a non-Angular library | REACT: react-chartjs-2 (<Bar data options />) | INTERVIEW: create the instance in ngAfterViewInit (the <canvas> exists only after the view renders), update it from an effect() when inputs change, and destroy() it in ngOnDestroy to avoid leaks.
// CONCEPT: NgZone.runOutsideAngular | INTERVIEW: Chart.js fires many animation frames/mouse events; running it outside Angular stops each one from triggering change detection. (This app is zoneless, where it's a no-op — but you'll see it in every zone-based client project.)
//
// Usage:
//   <app-chart type="bar" [data]="data()" [options]="options" (chartClick)="drill($event)" />
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `<canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>`,
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions>({});
  readonly plugins = input<Plugin[]>([]);
  readonly ariaLabel = input('Chart');

  readonly chartClick = output<ChartClickEvent>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    // Keep the live chart in sync with input changes (the React equivalent re-rendered <Bar/>).
    effect(() => {
      const data = this.data();
      const options = this.options();
      if (!this.chart) return; // first render happens in ngAfterViewInit
      this.chart.data = data;
      this.chart.options = this.withClickHandler(options);
      this.zone.runOutsideAngular(() => this.chart?.update());
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.chart = new Chart(this.canvas().nativeElement, {
        type: this.type(),
        data: this.data(),
        options: this.withClickHandler(this.options()),
        plugins: this.plugins(),
      });
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy(); // frees the canvas, listeners and animation frames
    this.chart = null;
  }

  /** PNG data URL of the current chart — used by ChartCard's download button. */
  toBase64Image(): string | null {
    return this.chart?.toBase64Image('image/png', 1) ?? null;
  }

  private withClickHandler(options: ChartOptions): ChartOptions {
    return {
      ...options,
      onClick: (event, elements, chart) => {
        const first = elements[0];
        // Re-enter Angular so subscribers (e.g. router navigation) run normally.
        if (first) {
          this.zone.run(() =>
            this.chartClick.emit({ index: first.index, datasetIndex: first.datasetIndex }),
          );
        }
        options.onClick?.call(chart, event, elements, chart);
      },
    };
  }
}
