import { Component, input } from '@angular/core';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { controlError, markForCheckOnFormEvents } from './form-helpers';

export interface ChipOption {
  readonly id: string;
  readonly label: string;
}

/** Chip-box multi-select (React: ChipMultiSelectField) — mat-select `multiple` + removable chips. */
@Component({
  selector: 'app-chip-multi-select',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatChipsModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [formControl]="control()" multiple [id]="fieldId()" [placeholder]="placeholder()">
        @for (option of options(); track option.id) {
          <mat-option [value]="option.id">{{ option.label }}</mat-option>
        } @empty {
          <mat-option disabled>No options available</mat-option>
        }
      </mat-select>
      @if (control().invalid) {
        <mat-error>{{ error() }}</mat-error>
      }
    </mat-form-field>
    @if (selectedOptions.length > 0) {
      <mat-chip-set class="mt-2 block" [attr.aria-label]="label() + ' selection'">
        @for (option of selectedOptions; track option.id) {
          <mat-chip (removed)="remove(option.id)">
            {{ option.label }}
            <button matChipRemove [attr.aria-label]="'Remove ' + option.label">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          </mat-chip>
        }
      </mat-chip-set>
    }
  `,
})
export class ChipMultiSelect {
  readonly control = input.required<FormControl<string[]>>();
  readonly options = input.required<readonly ChipOption[]>();
  readonly label = input.required<string>();
  readonly fieldId = input<string>('');
  readonly placeholder = input('Select…');

  constructor() {
    markForCheckOnFormEvents(() => this.control());
  }

  protected get selectedOptions(): ChipOption[] {
    const ids = this.control().value;
    return this.options().filter((o) => ids.includes(o.id));
  }

  protected error(): string | null {
    return controlError(this.control());
  }

  protected remove(id: string): void {
    const control = this.control();
    control.setValue(control.value.filter((v) => v !== id));
    control.markAsDirty();
    control.markAsTouched();
  }
}
