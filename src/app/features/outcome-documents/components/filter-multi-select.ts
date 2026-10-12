import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { DropdownOption } from '../models/outcome-documents.models';

// CONCEPT: CDK Overlay (cdkConnectedOverlay) | REACT: FloatingPortal (createPortal into document.body) | INTERVIEW: the panel renders in a global overlay container, so the card's overflow-hidden can't clip it; the CDK positions it next to the origin and reports outside clicks.
@Component({
  selector: 'app-filter-multi-select',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-flex' },
  template: `
    <button
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      (click)="toggleOpen.emit()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="isOpen()"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
      [ngClass]="
        isActive()
          ? 'border-[#2C59A7] bg-[#2C59A7] text-white'
          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#2C59A7] hover:bg-[#F0F5FF] hover:text-[#2C59A7]'
      "
    >
      <span class="material-symbols-outlined text-[14px]" aria-hidden="true">{{ icon() }}</span>
      {{ label() }}
      @if (selected().length > 0) {
        <span
          class="rounded-full bg-[#FBF315] px-[7px] py-px text-[10px] font-extrabold text-[#1A3A6B]"
        >
          {{ selected().length }}
        </span>
      }
      <span
        class="material-symbols-outlined text-[14px] transition-transform"
        [class.rotate-180]="isOpen()"
        [class.opacity-60]="!isActive()"
        aria-hidden="true"
        >expand_more</span
      >
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayMinWidth]="220"
      [cdkConnectedOverlayOffsetY]="6"
      (overlayOutsideClick)="onOutsideClick($event, origin)"
      (detach)="closed.emit()"
    >
      <div
        class="flex max-w-[320px] min-w-[220px] flex-col overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.06)]"
      >
        <div
          class="flex items-center justify-between border-b border-[#F0F3F8] bg-white px-[14px] pt-[11px] pb-[10px]"
        >
          <span class="text-[12.5px] font-bold text-[#1E3A5F]">{{ label() }}</span>
          @if (selected().length > 0) {
            <span
              class="rounded-full bg-[#EEF4FF] px-[9px] py-0.5 text-[11px] font-semibold text-[#2C59A7]"
            >
              {{ selected().length }} selected
            </span>
          }
        </div>

        <div
          class="flex items-center justify-between gap-2 border-b border-[#F0F3F8] bg-[#F9FAFB] px-3.5 py-[7px]"
        >
          <span class="text-[11px] text-[#94A3B8]">Multi-select</span>
          <span class="flex items-center gap-2.5 text-[11.5px]">
            <button
              type="button"
              (click)="selectAll.emit(optionIds())"
              [disabled]="options().length === 0"
              class="cursor-pointer font-bold text-[#2C59A7] hover:underline disabled:cursor-not-allowed disabled:text-[#94A3B8] disabled:no-underline"
            >
              Select all
            </button>
            <span class="text-[#E2E8F0]">|</span>
            <button
              type="button"
              (click)="cleared.emit()"
              [disabled]="selected().length === 0"
              class="cursor-pointer font-semibold text-[#64748B] hover:underline disabled:cursor-not-allowed disabled:text-[#94A3B8] disabled:no-underline"
            >
              Clear
            </button>
          </span>
        </div>

        <div
          class="max-h-[260px] overflow-y-auto py-1"
          role="listbox"
          [attr.aria-label]="label()"
          aria-multiselectable="true"
        >
          @for (option of options(); track option.id) {
            <label
              class="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-[12.5px] transition-colors hover:bg-[#F0F5FF]"
              [ngClass]="
                isChecked(option.id)
                  ? 'bg-[#F0F5FF] font-semibold text-[#1E3A5F]'
                  : 'font-normal text-[#374151]'
              "
            >
              <input
                type="checkbox"
                class="h-4 w-4 shrink-0 cursor-pointer rounded border-[#CBD5E1] text-[#2C59A7] focus:ring-[#2C59A7]"
                [checked]="isChecked(option.id)"
                (change)="toggleValue.emit(option.id)"
              />
              <span class="flex-1 truncate">{{ option.name }}</span>
              <span class="text-[10px] text-[#9CA3AF]">{{ option.declarationCount }}</span>
            </label>
          } @empty {
            <div class="px-3.5 py-4 text-center text-[13px] text-[#94A3B8] italic">
              No options found
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class FilterMultiSelect {
  readonly label = input.required<string>();
  readonly icon = input('filter_list');
  readonly options = input<readonly DropdownOption[]>([]);
  readonly selected = input<readonly number[]>([]);
  readonly isOpen = input(false);

  readonly toggleOpen = output();
  readonly closed = output();
  readonly toggleValue = output<number>();
  readonly selectAll = output<number[]>();
  readonly cleared = output();

  protected readonly isActive = computed(() => this.selected().length > 0 || this.isOpen());
  protected readonly optionIds = computed(() => this.options().map((o) => o.id));
  private readonly selectedSet = computed(() => new Set(this.selected()));

  protected isChecked(id: number): boolean {
    return this.selectedSet().has(id);
  }

  /** A click on our own trigger button is handled by (click) → toggleOpen; don't close twice. */
  protected onOutsideClick(event: MouseEvent, origin: CdkOverlayOrigin): void {
    const target = event.target as Node | null;
    const button = origin.elementRef.nativeElement as HTMLElement;
    if (target && button.contains(target)) return;
    this.closed.emit();
  }
}
