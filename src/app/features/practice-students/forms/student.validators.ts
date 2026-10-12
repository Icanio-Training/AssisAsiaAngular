import type {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { catchError, map, type Observable, of, switchMap, timer } from 'rxjs';

import { yearsBetween } from '../models/student.model';

// CONCEPT: custom (sync) validator | REACT: a zod `.refine()` / react-hook-form `validate: v => …` | INTERVIEW: a ValidatorFn is just (control) => ValidationErrors | null — return null when valid, an error object (the "error key") when not.
/** Fails with `{ hasDigits: true }` when the text contains 0-9. */
export const noDigitsValidator: ValidatorFn = (control) => {
  const value: unknown = control.value;
  return typeof value === 'string' && /\d/.test(value) ? { hasDigits: true } : null;
};

// CONCEPT: cross-field (group) validator | REACT: zod `.superRefine()` on the whole object | INTERVIEW: put it on the FormGroup (not a control) because it needs TWO values; the error lands on the group, so the template reads form.hasError('…').
/**
 * On a group with `dateOfBirth` and `enrolledOn` (Date | null) controls:
 *   enrolledOn <= dateOfBirth  → { enrolledBeforeBirth: true }
 *   age at enrolment < minAge  → { tooYoung: { minAge, actualAge } }
 */
export function enrolmentAgeValidator(minAge = 16): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dob: unknown = group.get('dateOfBirth')?.value;
    const enrolled: unknown = group.get('enrolledOn')?.value;
    if (!(dob instanceof Date) || !(enrolled instanceof Date)) return null; // `required` handles empties
    if (enrolled.getTime() <= dob.getTime()) return { enrolledBeforeBirth: true };
    const actualAge = yearsBetween(dob, enrolled);
    return actualAge < minAge ? { tooYoung: { minAge, actualAge } } : null;
  };
}

/** The one method the async validator needs — a fake is easy to pass in tests. */
export interface EmailAvailabilityChecker {
  isEmailAvailable(email: string): Observable<boolean>;
}

// CONCEPT: async validator (debounced with timer + switchMap) | REACT: react-hook-form `validate: async v => await api.check(v)` | INTERVIEW: Angular re-subscribes on every value change and UNSUBSCRIBES the previous one — so timer(400) acts as a debounce, and while it runs the control's status is 'PENDING'.
// Async validators only run after all sync validators pass (no request for "abc").
/**
 * `{ emailTaken: true }` when the server says the email exists.
 * `ownEmail()` lets the edit page skip the check for the student's current address.
 */
export function emailAvailableValidator(
  checker: EmailAvailabilityChecker,
  ownEmail: () => string | null = () => null,
  debounceMs = 400,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = String(control.value ?? '')
      .trim()
      .toLowerCase();
    if (!email || email === ownEmail()?.toLowerCase()) return of(null);

    return timer(debounceMs).pipe(
      switchMap(() => checker.isEmailAvailable(email)),
      map((available) => (available ? null : { emailTaken: true })),
      catchError(() => of(null)), // network hiccup → don't block the form; the server re-checks on save
    );
  };
}
