import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

import { FILTER_GROUPS } from '../constants/outcome-documents.constants';
import type { DeclarationFilters, DropdownFilterKey } from '../models/outcome-documents.models';
import type { DeclarationDropdowns } from '../services/declaration-dropdowns.service';
import { formatChipValue, namesFor } from '../utils/declaration-labels';
import { FilterMultiSelect } from './filter-multi-select';

/** Filter bar (7 multi-selects + Reset), active-filter chips, and the search box. */
@Component({
  selector: 'app-matrix-filters',
  imports: [FilterMultiSelect, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-2 px-6 pt-4">
      <span
        class="mr-1 flex items-center gap-1 text-[11px] font-bold tracking-[.05em] text-[#64748B] uppercase"
      >
        <span class="material-symbols-outlined text-[14px]" aria-hidden="true">tune</span>
        Filters
      </span>
      <div class="mx-1 h-[22px] w-px bg-[#E2E8F0]"></div>

      @for (group of groups; track group.key) {
        <app-filter-multi-select
          [label]="group.label"
          [icon]="group.icon"
          [options]="dropdowns()?.[group.key] ?? []"
          [selected]="filters()[group.key]"
          [isOpen]="openGroup() === group.key"
          (toggleOpen)="toggleGroup(group.key)"
          (closed)="closeGroup(group.key)"
          (toggleValue)="toggleValue.emit({ key: group.key, value: $event })"
          (selectAll)="selectAll.emit({ key: group.key, ids: $event })"
          (cleared)="clearGroup.emit(group.key)"
        />
      }

      <div class="mx-1 h-[22px] w-px bg-[#E2E8F0]"></div>
      <button
        type="button"
        (click)="resetAll.emit()"
        [disabled]="!hasActiveFilters()"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:border-[#2C59A7] hover:bg-[#F0F5FF] hover:text-[#2C59A7] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span class="material-symbols-outlined text-[14px]" aria-hidden="true">restart_alt</span>
        Reset
      </button>
    </div>

    @if (chips().length > 0) {
      <mat-chip-set class="block px-6 pt-2" aria-label="Active filters">
        @for (chip of chips(); track chip.key) {
          <mat-chip (removed)="clearGroup.emit(chip.key)">
            {{ chip.label }}
            <button matChipRemove [attr.aria-label]="'Remove ' + chip.label + ' filter'">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">cancel</span>
            </button>
          </mat-chip>
        }
      </mat-chip-set>
    }

    <div class="flex flex-wrap items-center gap-3.5 border-b border-[#E2E8F0] px-6 py-4">
      <div class="relative max-w-[320px] min-w-[220px] flex-1">
        <span
          class="material-symbols-outlined pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[16px] text-[#9CA3AF]"
          aria-hidden="true"
          >search</span
        >
        <input
          #searchBox
          type="text"
          aria-label="Search declarations"
          [value]="search()"
          (input)="searchChange.emit(searchBox.value)"
          placeholder="Search…"
          class="h-9 w-full max-w-[280px] rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pr-3.5 pl-[34px] text-[13px] transition-colors outline-none focus:border-[#2C59A7] focus:bg-white focus:shadow-[0_0_0_3px_rgba(44,89,167,0.08)]"
        />
      </div>
    </div>
  `,
})
export class MatrixFilters {
  readonly filters = input.required<DeclarationFilters>();
  readonly search = input('');
  readonly dropdowns = input<DeclarationDropdowns | undefined>();
  readonly dropdownsError = input(false);

  readonly toggleValue = output<{ key: DropdownFilterKey; value: number }>();
  readonly selectAll = output<{ key: DropdownFilterKey; ids: number[] }>();
  readonly clearGroup = output<DropdownFilterKey>();
  readonly resetAll = output();
  readonly searchChange = output<string>();

  protected readonly groups = FILTER_GROUPS;
  /** Only one dropdown open at a time — local UI state, so it lives in the component. */
  protected readonly openGroup = signal<DropdownFilterKey | null>(null);

  protected readonly hasActiveFilters = computed(() =>
    FILTER_GROUPS.some((g) => this.filters()[g.key].length > 0),
  );

  protected readonly chips = computed(() => {
    const dropdowns = this.dropdowns();
    return FILTER_GROUPS.filter((g) => this.filters()[g.key].length > 0).map((g) => {
      let value = '…';
      if (dropdowns) value = formatChipValue(namesFor(dropdowns[g.key], this.filters()[g.key]));
      else if (this.dropdownsError()) value = 'Unavailable';
      return { key: g.key, label: `${g.label}: ${value}` };
    });
  });

  protected toggleGroup(key: DropdownFilterKey): void {
    this.openGroup.update((current) => (current === key ? null : key));
  }

  /** Close only if THIS group is the open one (a closing panel must not close the newly opened one). */
  protected closeGroup(key: DropdownFilterKey): void {
    this.openGroup.update((current) => (current === key ? null : current));
  }
}
