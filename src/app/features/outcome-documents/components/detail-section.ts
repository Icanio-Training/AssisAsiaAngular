import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import type { DeclarationCountryActions } from '../models/outcome-documents.models';

/** White card with an underlined, icon-prefixed title; the body is projected. */
@Component({
  selector: 'app-detail-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block rounded-xl border border-[#E2E8F0] bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,.05),0_4px_12px_rgba(15,23,42,.04)]',
  },
  template: `
    <h2
      class="mb-3.5 flex items-center gap-2 border-b-2 border-[#2C59A7] pb-2.5 text-[11.5px] font-extrabold tracking-[.1em] text-[#2C59A7] uppercase"
    >
      <span class="material-symbols-outlined text-[16px]" aria-hidden="true">{{ icon() }}</span>
      {{ title() }}
    </h2>
    <ng-content />
  `,
})
export class DetailSection {
  readonly title = input.required<string>();
  readonly icon = input('description');
}

/** One AMS row of "ASEAN Member State Coverage" — expandable when it has actions. */
@Component({
  selector: 'app-country-coverage-row',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-b border-[#F1F5F9] last:border-b-0' },
  template: `
    <button
      type="button"
      class="flex w-full items-center gap-2.5 py-[11px] text-left"
      [class.cursor-pointer]="hasActions()"
      [class.cursor-default]="!hasActions()"
      [disabled]="!hasActions()"
      [attr.aria-expanded]="hasActions() ? open() : null"
      [title]="hasActions() ? 'Click to expand ' + country().name + ' actions' : ''"
      (click)="open.set(!open())"
    >
      <span
        class="min-w-[10px] text-[9px] transition-transform"
        [ngClass]="open() ? 'rotate-90 text-[#2C59A7]' : 'text-[#CBD5E1]'"
        aria-hidden="true"
      >
        {{ hasActions() ? '▶' : '' }}
      </span>
      <span
        class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[5px] text-[8px] font-extrabold tracking-[.04em]"
        [ngClass]="hasValue() ? 'bg-[#2C59A7] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'"
      >
        {{ country().code }}
      </span>
      <span class="min-w-[110px] shrink-0 text-xs font-medium text-[#374151]">{{
        country().name
      }}</span>
      <span class="h-[7px] flex-1 overflow-hidden rounded-full bg-[#EEF2FB]">
        <span
          class="block h-full rounded-full bg-[linear-gradient(90deg,#2C59A7,#4A7ED4)] transition-[width] duration-[450ms]"
          [style.width.%]="barWidth()"
          [style.opacity]="hasValue() ? 1 : 0"
        ></span>
      </span>
      <span
        class="min-w-[22px] text-right text-[13px] font-bold"
        [ngClass]="hasValue() ? 'text-[#1A3A6B]' : 'text-[#CBD5E1]'"
      >
        {{ hasValue() ? country().count : '—' }}
      </span>
    </button>

    @if (hasActions() && open()) {
      <div class="rounded-b-lg border-b border-[#F1F5F9] bg-[#F8FAFC] py-2 pr-3 pl-[46px]">
        @for (action of country().actions; track $index) {
          <div class="py-[3px] text-[11px] leading-[1.5] break-words text-[#475569]">
            {{ action }}
          </div>
        }
      </div>
    }
  `,
})
export class CountryCoverageRow {
  readonly country = input.required<DeclarationCountryActions>();
  readonly maxCount = input(1);

  protected readonly open = signal(false);
  protected readonly hasValue = computed(() => this.country().count > 0);
  protected readonly hasActions = computed(() => this.country().actions.length > 0);
  protected readonly barWidth = computed(() => {
    const max = this.maxCount();
    return max > 0 ? Math.round((this.country().count / max) * 100) : 0;
  });
}
