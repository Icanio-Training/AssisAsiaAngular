import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { levelBadgeStyle, typeBadgeStyle } from '../utils/declaration-labels';

// CONCEPT: [style.x] bindings | REACT: style={{ backgroundColor: style.bg, color: style.color }} | INTERVIEW: bind one CSS property at a time; Angular sanitizes values and only touches the DOM when they change.
@Component({
  selector: 'app-type-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-[5px] rounded-full px-[11px] py-1 text-[11px] font-semibold whitespace-nowrap"
      [style.background-color]="badge().bg"
      [style.color]="badge().color"
    >
      <span
        class="h-[7px] w-[7px] shrink-0 rounded-full"
        [style.background-color]="badge().color"
      ></span>
      {{ badge().label }}
    </span>
  `,
})
export class TypeBadge {
  readonly type = input.required<string>();
  protected readonly badge = computed(() => typeBadgeStyle(this.type()));
}

@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-[5px] rounded-full px-[10px] py-[3px] text-xs font-bold whitespace-nowrap"
      [style.background-color]="badge().bg"
      [style.color]="badge().color"
    >
      <span
        class="h-[7px] w-[7px] shrink-0 rounded-full"
        [style.background-color]="badge().color"
      ></span>
      {{ badge().label }}
    </span>
  `,
})
export class LevelBadge {
  readonly level = input.required<string>();
  protected readonly badge = computed(() => levelBadgeStyle(this.level()));
}
