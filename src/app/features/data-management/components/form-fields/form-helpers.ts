import { ChangeDetectorRef, computed, Directive, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import type { AbstractControl, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import type { ErrorStateMatcher } from '@angular/material/core';
import { EMPTY, switchMap } from 'rxjs';

import { firstErrorMessage } from '../../validators/form.validators';

/**
 * Re-render an OnPush component whenever a form it RECEIVED (via input) changes state.
 *
 * CONCEPT: OnPush + zoneless with reactive forms | REACT: react-hook-form re-renders subscribers via formState proxies | INTERVIEW: an OnPush child only re-renders when its inputs change, an event fires in its template, or it's marked. A parent calling markAllAsTouched() changes neither, so we listen to the unified `control.events` stream (v18+) and markForCheck().
 *
 * Call from a constructor (needs an injection context).
 */
export function markForCheckOnFormEvents(form: () => AbstractControl | undefined): void {
  const cdr = inject(ChangeDetectorRef);
  toObservable(computed(form))
    .pipe(
      // CONCEPT: switchMap | INTERVIEW: when the input form instance changes, drop the old subscription and follow the new one.
      switchMap((control) => (control ? control.events : EMPTY)),
      // CONCEPT: takeUntilDestroyed | REACT: the cleanup function returned from useEffect | INTERVIEW: completes the stream when the component is destroyed — no manual ngOnDestroy/unsubscribe.
      takeUntilDestroyed(),
    )
    .subscribe(() => cdr.markForCheck());
}

/** Message for <mat-error> / inline errors. */
export function controlError(control: AbstractControl | null | undefined): string | null {
  return control ? firstErrorMessage(control.errors) : null;
}

export function showError(control: AbstractControl | null | undefined): boolean {
  return Boolean(control && control.invalid && (control.touched || control.dirty));
}

// CONCEPT: ErrorStateMatcher | REACT: zod refine with `path: ['workplanComplete']` | INTERVIEW: <mat-error> only shows when the CONTROL is in error; a matcher lets a group-level (cross-field) error light up a specific field too.
export class GroupErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly groupErrorKey: string) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) return false;
    const touched = control.touched || Boolean(form?.submitted);
    const groupError = Boolean(control.parent?.hasError(this.groupErrorKey));
    return (control.invalid || groupError) && touched;
  }
}

/** Blocks non-digit keystrokes and sanitizes pastes (NumberField / YearField in React). */
@Directive({
  selector: 'input[appDigitsOnly]',
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
    '(keydown)': 'onKeyDown($event)',
    '(input)': 'onInput($event)',
  },
})
export class DigitsOnlyDirective {
  /** Max number of digits (4 for years). */
  readonly appDigitsOnly = input<number | ''>('');

  private static readonly ALLOWED = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]);

  protected onKeyDown(event: KeyboardEvent): void {
    if (DigitsOnlyDirective.ALLOWED.has(event.key) || event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const max = this.appDigitsOnly();
    const digits = el.value.replace(/\D/g, '');
    const next = max ? digits.slice(0, max) : digits;
    if (next !== el.value) {
      el.value = next;
      // Re-dispatch so the form control sees the sanitized value.
      el.dispatchEvent(new Event('input'));
    }
  }
}
