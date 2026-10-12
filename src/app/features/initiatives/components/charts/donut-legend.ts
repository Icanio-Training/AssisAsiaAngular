import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { DonutSlice } from './chart-configs';

/** HTML legend beside a donut — every row is a button that drills like a slice click.
    'period' = Zone 1 period donut; 'code' = objective / strategic-measure donuts. */
@Component({
  selector: 'app-donut-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 flex-1' },
  template: `
    @if (variant() === 'period') {
      <ul class="space-y-[13px]">
        @for (slice of slices(); track slice.key) {
          <li>
            <button
              type="button"
              (click)="selected.emit(slice.key)"
              class="flex w-full cursor-pointer items-center gap-[9px] rounded-md px-2 py-[5px] text-left transition-colors hover:bg-[#F8FAFC]"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full"
                [style.background-color]="slice.color"
                aria-hidden="true"
              ></span>
              <span class="mx-[6px] flex-1 text-xs text-[#0F172A]">{{ slice.label }}</span>
              <span class="shrink-0 text-sm font-bold text-[#374151]"
                >{{ slice.count }} ({{ slice.percentage }}%)</span
              >
            </button>
          </li>
        }
      </ul>
    } @else {
      <ul class="max-h-[240px] space-y-0.5 overflow-y-auto">
        @for (slice of slices(); track slice.key) {
          <li>
            <button
              type="button"
              [disabled]="!slice.active"
              (click)="selected.emit(slice.key)"
              class="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors"
              [class]="slice.active ? 'cursor-pointer hover:bg-[#F0F5FF]' : 'cursor-default'"
            >
              <span
                class="h-2.5 w-2.5 shrink-0 rounded-full"
                [style.background-color]="slice.color"
                [style.opacity]="slice.active ? 1 : 0.3"
                aria-hidden="true"
              ></span>
              <span
                class="flex-1 truncate text-xs"
                [class]="slice.active ? 'font-medium text-gray-700' : 'text-gray-400'"
                >{{ slice.label }}</span
              >
              <span
                class="shrink-0 text-[11px]"
                [class]="slice.active ? 'text-gray-500' : 'text-gray-300'"
                >{{ slice.active ? slice.count : '' }}</span
              >
              <span
                class="min-w-[38px] shrink-0 text-right text-[11px] font-bold"
                [class]="slice.active ? 'text-primary-600' : 'text-gray-300'"
                >{{ slice.percentage }}%</span
              >
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class DonutLegend {
  readonly slices = input.required<readonly DonutSlice[]>();
  readonly variant = input<'period' | 'code'>('code');
  readonly selected = output<string>();
}
