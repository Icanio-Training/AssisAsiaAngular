import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, input, signal } from '@angular/core';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import { type MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';

import { formatSdg, SDG_VALUE_MESSAGE, SDG_VALUE_REGEX } from '../../validators/form.validators';
import { controlError, markForCheckOnFormEvents } from './form-helpers';

/** SDG tag input (React: ChipTagInputField) — "5.2" becomes the chip "SDG 5.2", invalid text is rejected. */
@Component({
  selector: 'app-sdg-chip-input',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatChipsModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>SDG</mat-label>
      <mat-chip-grid #grid [formControl]="control()" aria-label="SDG targets">
        @for (chip of control().value; track chip) {
          <mat-chip-row (removed)="remove(chip)">
            {{ chip }}
            <button matChipRemove [attr.aria-label]="'Remove ' + chip">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          </mat-chip-row>
        }
        <input
          id="sdgs"
          [placeholder]="control().value.length === 0 ? placeholder() : ''"
          [matChipInputFor]="grid"
          [matChipInputSeparatorKeyCodes]="separators"
          (matChipInputTokenEnd)="add($event)"
          (input)="inputError.set(null)"
        />
      </mat-chip-grid>
      @if (inputError(); as message) {
        <mat-hint class="!text-[#D92D20]">{{ message }}</mat-hint>
      }
      @if (control().invalid) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class SdgChipInput {
  readonly control = input.required<FormControl<string[]>>();
  readonly placeholder = input('Type an SDG target and press Enter, e.g. 5.2 or SDG 5.2');

  protected readonly separators = [ENTER, COMMA] as const;
  protected readonly inputError = signal<string | null>(null);

  constructor() {
    markForCheckOnFormEvents(() => this.control());
  }

  protected error(): string | null {
    return controlError(this.control());
  }

  protected add(event: MatChipInputEvent): void {
    const typed = event.value.trim();
    if (!typed) return;
    if (!SDG_VALUE_REGEX.test(typed)) {
      this.inputError.set(SDG_VALUE_MESSAGE);
      return;
    }
    const chip = formatSdg(typed);
    const control = this.control();
    if (!control.value.includes(chip)) control.setValue([...control.value, chip]);
    control.markAsDirty();
    event.chipInput.clear();
    this.inputError.set(null);
  }

  protected remove(chip: string): void {
    const control = this.control();
    control.setValue(control.value.filter((v) => v !== chip));
    control.markAsDirty();
    control.markAsTouched();
  }
}
