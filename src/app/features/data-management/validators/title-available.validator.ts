import type { AsyncValidatorFn } from '@angular/forms';
import { catchError, map, of, timer, switchMap, take } from 'rxjs';

import type { DeclarationsService } from '../services/declarations.service';

// CONCEPT: async validator | REACT: none (React only validated on the server) | INTERVIEW: an AsyncValidatorFn returns Observable<ValidationErrors | null>; while it runs the control is PENDING. Debounce with timer()+switchMap — when the value changes Angular unsubscribes the previous run, so only the last check hits the API.
//
// Why this one: duplicate declaration titles were a real data-quality complaint, and the
// existing `GET declarations/filter?search=` endpoint answers it without a new API.
export function titleAvailableValidator(
  declarations: DeclarationsService,
  /** The record being edited — its own title is not a duplicate. */
  excludeId?: number,
): AsyncValidatorFn {
  return (control) => {
    const title = String(control.value ?? '').trim();
    if (title.length < 3) return of(null);
    return timer(400).pipe(
      switchMap(() => declarations.findTitles(title)),
      map((matches) =>
        matches.some(
          (m) => m.id !== excludeId && m.title.trim().toLowerCase() === title.toLowerCase(),
        )
          ? { titleTaken: { message: 'A declaration with this title already exists' } }
          : null,
      ),
      // CONCEPT: catchError | INTERVIEW: a failing check must not block the form — swallow and treat as valid; the server still enforces uniqueness.
      catchError(() => of(null)),
      take(1),
    );
  };
}
