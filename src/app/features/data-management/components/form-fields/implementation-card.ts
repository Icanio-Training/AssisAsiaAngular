import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { type FormArray, NonNullableFormBuilder } from '@angular/forms';

import {
  createImplementationItem,
  type ImplementationItemForm,
} from '../../forms/follow-up-action.form';
import { markForCheckOnFormEvents } from './form-helpers';

/** One "Regional" / member-state card: a FormArray of implementation lines (React: ImplementationCard). */
@Component({
  selector: 'app-implementation-card',
  imports: [NgOptimizedImage],
  template: `
    <div class="relative rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4">
      @if (flag(); as src) {
        <img
          [ngSrc]="src"
          width="28"
          height="18"
          [alt]="title() + ' flag'"
          class="absolute top-4 right-4 h-[18px] w-7 rounded-[3px] border border-[#D0D5DD] object-cover"
        />
      }
      <div class="text-sm font-bold text-[#101828]">{{ title() }}</div>
      <div class="mt-0.5 text-xs text-[#667085]">Implementations ({{ items().length }})</div>

      @if (items().length > 0) {
        <ul class="mt-2.5 overflow-hidden rounded-lg border border-[#D4D4D4] bg-white">
          @for (item of items().controls; track item; let i = $index) {
            <li
              class="flex items-center justify-between gap-3 border-b border-[#F2F4F7] px-3.5 py-2.5 text-[13px] text-[#344054] last:border-b-0"
            >
              <span>{{ item.controls.text.value }}</span>
              @if (!readOnly()) {
                <button
                  type="button"
                  (click)="remove(i)"
                  [attr.aria-label]="'Remove implementation ' + (i + 1) + ' for ' + title()"
                  class="flex shrink-0 text-[#98A2B3] hover:text-[#667085]"
                >
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >close</span
                  >
                </button>
              }
            </li>
          }
        </ul>
      } @else if (readOnly()) {
        <div class="mt-2.5 text-sm font-bold text-[#101828]">-None-</div>
      }

      @if (!readOnly()) {
        <input
          #draft
          [attr.aria-label]="'Add implementation for ' + title()"
          placeholder="Enter implementation and press Enter"
          (keydown.enter)="add(draft); $event.preventDefault()"
          class="mt-2.5 h-[38px] w-full rounded-lg border border-[#D4D4D4] bg-white px-3 text-[13px] text-[#101828] outline-none focus:border-[#0063AF]"
        />
      }
    </div>
  `,
})
export class ImplementationCard {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly items = input.required<FormArray<ImplementationItemForm>>();
  readonly title = input.required<string>();
  readonly flag = input<string | undefined>(undefined);
  readonly readOnly = input(false);

  constructor() {
    markForCheckOnFormEvents(() => this.items());
  }

  protected add(draft: HTMLInputElement): void {
    const text = draft.value.trim();
    if (!text) return;
    this.items().push(createImplementationItem(this.fb, text));
    this.items().markAsDirty();
    draft.value = '';
  }

  protected remove(index: number): void {
    this.items().removeAt(index);
    this.items().markAsDirty();
  }
}
