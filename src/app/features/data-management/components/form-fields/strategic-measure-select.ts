import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { type FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  type MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { LookupsService, type StrategicMeasureOption } from '../../services/lookups.service';
import { markForCheckOnFormEvents } from './form-helpers';

const SELECT_ALL = '__all__';

/**
 * "Corresponding Strategic Measures" — async, server-side searchable multi-select
 * (React: StrategicMeasureMultiSelectField with a 300 ms setTimeout debounce + TanStack Query).
 */
@Component({
  selector: 'app-strategic-measure-select',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatChipsModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>Corresponding Strategic Measures</mat-label>
      <mat-chip-grid #grid aria-label="Selected strategic measures">
        @for (option of selectedOptions(); track option.id) {
          <mat-chip-row (removed)="toggle(option.id)">
            {{ option.code }}
            <button matChipRemove [attr.aria-label]="'Remove ' + option.code">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          </mat-chip-row>
        }
        <input
          id="strategicMeasureIds"
          placeholder="Type to search…"
          [formControl]="search"
          [matChipInputFor]="grid"
          [matAutocomplete]="auto"
        />
      </mat-chip-grid>
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSelected($event)">
        @if (loading()) {
          <mat-option disabled>Loading…</mat-option>
        } @else if (options().length === 0) {
          <mat-option disabled>No strategic measures found</mat-option>
        } @else {
          <mat-option [value]="selectAll">
            <span class="font-semibold"
              >{{ allVisibleSelected() ? 'Clear' : 'Select' }} all shown</span
            >
          </mat-option>
          @for (option of options(); track option.id) {
            <mat-option [value]="option.id">
              <span class="mr-1" aria-hidden="true">{{ isSelected(option.id) ? '☑' : '☐' }}</span>
              <span class="font-bold text-[#101828]">{{ option.code }}</span>
              <span class="ml-1 text-[#475467]">{{ option.description }}</span>
            </mat-option>
          }
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
})
export class StrategicMeasureSelect {
  private readonly lookups = inject(LookupsService);

  readonly control = input.required<FormControl<string[]>>();

  protected readonly selectAll = SELECT_ALL;
  protected readonly search = inject(NonNullableFormBuilder).control('');
  protected readonly loading = signal(false);
  /** Every option ever fetched — selected chips keep their label after a narrower search. */
  private readonly known = signal(new Map<string, StrategicMeasureOption>());

  // CONCEPT: debounceTime + distinctUntilChanged + switchMap (typeahead) | REACT: useEffect(setTimeout(…, 300)) + useQuery(['strategicMeasures', search]) | INTERVIEW: debounce waits for a typing pause, distinctUntilChanged skips identical terms, switchMap CANCELS the in-flight request when a newer term arrives (no out-of-order results).
  protected readonly options = toSignal(
    this.search.valueChanges.pipe(
      startWith(''),
      map((term) => term.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap((term) =>
        this.lookups.searchStrategicMeasures(term).pipe(
          catchError(() => of<StrategicMeasureOption[]>([])),
          // CONCEPT: finalize | INTERVIEW: runs on complete, error AND unsubscribe (switchMap cancel) — the right place to clear a loading flag.
          finalize(() => this.loading.set(false)),
        ),
      ),
      tap((options) =>
        this.known.update((prev) => {
          const next = new Map(prev);
          for (const o of options) next.set(String(o.id), o);
          return next;
        }),
      ),
      takeUntilDestroyed(),
    ),
    { initialValue: [] as StrategicMeasureOption[] },
  );

  /** The control's value as a signal (follows the control even if an edit page patches it). */
  private readonly selectedIds = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => control.valueChanges.pipe(startWith(control.value))),
    ),
    { initialValue: [] as string[] },
  );

  protected readonly selectedOptions = computed(() =>
    this.selectedIds()
      .map((id) => this.known().get(id))
      .filter((o): o is StrategicMeasureOption => Boolean(o)),
  );

  protected readonly allVisibleSelected = computed(() => {
    const ids = this.selectedIds();
    const visible = this.options();
    return visible.length > 0 && visible.every((o) => ids.includes(String(o.id)));
  });

  constructor() {
    markForCheckOnFormEvents(() => this.control());
  }

  protected isSelected(id: number): boolean {
    return this.selectedIds().includes(String(id));
  }

  private syncIds(): string[] {
    return this.control().value;
  }

  protected onSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value as number | string;
    if (value === SELECT_ALL) {
      const visible = this.options().map((o) => String(o.id));
      const current = this.syncIds();
      this.write(
        this.allVisibleSelected()
          ? current.filter((id) => !visible.includes(id))
          : [...new Set([...current, ...visible])],
      );
    } else {
      this.toggle(Number(value));
    }
    event.option.deselect();
  }

  protected toggle(id: number): void {
    const key = String(id);
    const current = this.syncIds();
    this.write(current.includes(key) ? current.filter((v) => v !== key) : [...current, key]);
  }

  private write(ids: string[]): void {
    const control = this.control();
    control.setValue(ids);
    control.markAsDirty();
  }
}
