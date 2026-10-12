import { Component, computed, input, output } from '@angular/core';

import { hasValue, NO_DATA } from '../constants/strategic-goal-cards';
import type { DeepAnalysisChart, DeepAnalysisLogEntry } from '../models/blueprint-kpi.models';
import { formatBlocks } from '../utils/deep-analysis';

// Small presentational pieces of the KPI documentation (React: helpers inside KpiDocumentation.tsx).

export const DOC_TEXTAREA_CLASS =
  'block w-full resize-y rounded-lg border border-dashed border-[var(--accent)] bg-white px-3 py-2 text-[13.5px] leading-[1.8] text-[#10192B] [field-sizing:content] min-h-[96px] focus:border-solid focus:outline-none';

/** Paragraphs, with "- / • / 1." lines promoted to a bullet list. */
// CONCEPT: render structured text with @for/@switch, not [innerHTML] | REACT: building <p>/<ul> elements in a loop | INTERVIEW: API text is never parsed as HTML, so there is nothing to sanitize and no XSS risk.
@Component({
  selector: 'app-formatted-text',
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('p') {
          <p class="mb-[9px] last:mb-0">{{ block.text }}</p>
        }
        @case ('ul') {
          <ul class="mt-[5px] mb-[9px] ml-[18px] list-disc last:mb-0">
            @for (item of block.items; track $index) {
              <li class="mb-1.5 last:mb-0">{{ item }}</li>
            }
          </ul>
        }
      }
    }
  `,
})
export class FormattedText {
  readonly text = input.required<string>();
  protected readonly blocks = computed(() => formatBlocks(this.text()));
}

/** Collapsible panel built on native <details>/<summary> (keyboard + a11y for free). */
// CONCEPT: content projection (<ng-content>) | REACT: the `children` prop | INTERVIEW: the parent's markup is rendered inside the child's template slot.
@Component({
  selector: 'app-doc-panel',
  template: `
    <details
      [open]="defaultOpen()"
      class="group min-w-0 overflow-hidden rounded-xl border border-l-[3px] border-[#ECEFF7] border-l-transparent bg-[#F6F8FC] transition-[box-shadow,border-color] duration-200 hover:border-[#E3E8F2] hover:shadow-scd-sm open:border-l-[var(--accent)] open:bg-white open:shadow-scd-sm"
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-[13px] px-5 py-[18px] select-none [&::-webkit-details-marker]:hidden"
      >
        <span class="flex-1 text-[13.5px] font-bold tracking-[-0.005em] text-[#10192B]">{{
          title()
        }}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
          class="h-3.5 w-3.5 shrink-0 text-[#94A0B8] transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </summary>
      <div class="px-5 pb-5 text-[13.5px] leading-[1.8] font-normal text-[#10192B] md:pl-[65px]">
        <ng-content />
      </div>
    </details>
  `,
})
export class DocPanel {
  readonly title = input.required<string>();
  readonly defaultOpen = input(false);
}

/** Read mode: formatted text or "No Data Available". Edit mode: a textarea. */
@Component({
  selector: 'app-editable-text',
  imports: [FormattedText],
  template: `
    @if (isEditing()) {
      <textarea
        #box
        [attr.aria-label]="label()"
        [value]="draftValue()"
        (input)="draftValueChange.emit(box.value)"
        [class]="textareaClass"
      ></textarea>
      @if (hint()) {
        <p class="mt-1.5 text-[11.5px] leading-[1.5] text-[#94A0B8]">{{ hint() }}</p>
      }
    } @else if (displayValue(); as text) {
      <app-formatted-text [text]="text" />
    } @else {
      <p class="text-[13px] text-[#94A0B8] italic">{{ noData }}</p>
    }
  `,
})
export class EditableText {
  readonly label = input.required<string>();
  readonly value = input.required<string | null>();
  readonly isEditing = input(false);
  readonly draftValue = input('');
  readonly hint = input<string>();
  readonly draftValueChange = output<string>();

  protected readonly textareaClass = DOC_TEXTAREA_CLASS;
  protected readonly noData = NO_DATA;
  protected readonly displayValue = computed(() => {
    const value = this.value();
    return hasValue(value) ? value : null;
  });
}

const TH =
  'border-b border-[#ECEFF7] bg-[#F6F8FC] px-4 py-3 text-left text-[10.5px] font-bold tracking-[0.04em] whitespace-nowrap text-[#94A0B8] uppercase';
const TD = 'border-b border-[#ECEFF7] px-4 py-[11px] align-top text-[#10192B]';

/** Rows of a chart's baseline period that carry a data source or a value. */
export function baselineRows(chart: DeepAnalysisChart) {
  return (chart.memberStateData?.baseline?.rows ?? []).filter(
    (r) => hasValue(r.data_source) || r.value !== null,
  );
}

@Component({
  selector: 'app-baseline-table',
  template: `
    @if (rows().length > 0) {
      <div>
        @if (showTitle()) {
          <div class="mb-2 text-[12.5px] font-bold text-[#10192B]">
            {{ chart().chartTitle ?? 'Chart' }}{{ year() ? ' · ' + year() : '' }}
          </div>
        }
        <div class="overflow-x-auto rounded-xl border border-[#ECEFF7]">
          <table class="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th [class]="th">Member State</th>
                <th [class]="th">Data Source</th>
                <th [class]="th">Baseline Value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.country_code) {
                <tr class="[&:last-child>td]:border-b-0">
                  <td [class]="td + ' font-semibold whitespace-nowrap'">
                    {{ row.country_name ?? row.country_code }}
                  </td>
                  <td [class]="td">
                    @if (row.data_source && row.data_source.trim()) {
                      {{ row.data_source }}
                    } @else {
                      <span class="text-[#94A0B8] italic">{{ noData }}</span>
                    }
                  </td>
                  <td [class]="td">
                    @if (row.value !== null) {
                      {{ row.value }}
                    } @else {
                      <span class="text-[#94A0B8] italic">{{ noData }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class BaselineTable {
  readonly chart = input.required<DeepAnalysisChart>();
  readonly showTitle = input(false);

  protected readonly th = TH;
  protected readonly td = TD;
  protected readonly noData = NO_DATA;
  protected readonly rows = computed(() => baselineRows(this.chart()));
  protected readonly year = computed(() => this.chart().memberStateData?.baseline?.year ?? null);
}

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** documentRequests / amdComments: existing entries + (edit mode) a textarea for a new one. */
@Component({
  selector: 'app-log-entries',
  imports: [FormattedText],
  template: `
    @if (items().length === 0 && !isEditing()) {
      <p class="text-[13px] text-[#94A0B8] italic">{{ noData }}</p>
    }
    @if (items().length > 0) {
      <ul class="flex flex-col gap-3">
        @for (item of items(); track $index) {
          <li>
            <app-formatted-text [text]="item.message" />
            @if (item.meta) {
              <div class="text-[11.5px] leading-[1.5] text-[#94A0B8]">{{ item.meta }}</div>
            }
          </li>
        }
      </ul>
    }
    @if (isEditing()) {
      <textarea
        #box
        [attr.aria-label]="'Add ' + label()"
        placeholder="Add a new entry…"
        [value]="newEntry()"
        (input)="newEntryChange.emit(box.value)"
        [class]="textareaClass + (items().length > 0 ? ' mt-3' : '')"
      ></textarea>
    }
  `,
})
export class LogEntries {
  readonly label = input.required<string>();
  readonly entries = input.required<readonly DeepAnalysisLogEntry[]>();
  readonly isEditing = input(false);
  readonly newEntry = input('');
  readonly newEntryChange = output<string>();

  protected readonly textareaClass = DOC_TEXTAREA_CLASS;
  protected readonly noData = NO_DATA;
  protected readonly items = computed(() =>
    this.entries().map((entry) => ({
      message: entry.message,
      meta: [entry.country_code, formatDate(entry.at)].filter(Boolean).join(' · '),
    })),
  );
}
