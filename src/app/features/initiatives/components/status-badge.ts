import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { statusStyle } from '../constants/initiatives.constants';

/** Filled pill (table) or outline pill (detail page) for an activity status. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (outline()) {
      <span
        class="inline-block rounded-full px-3 py-[3px] text-[12.5px] font-bold whitespace-nowrap"
        [style.border]="'1.5px solid ' + colors().color"
        [style.color]="colors().color"
        >{{ status() }}</span
      >
    } @else {
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold whitespace-nowrap"
        [style.background-color]="colors().bg"
        [style.color]="colors().color"
      >
        <span class="h-[7px] w-[7px] rounded-full" [style.background-color]="colors().color"></span>
        {{ status() }}
      </span>
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly outline = input(false);

  protected readonly colors = computed(() => statusStyle(this.status()));
}
