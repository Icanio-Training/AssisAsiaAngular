import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';

import type { DeclarationDetail } from '../models/outcome-documents.models';
import { OutcomeDocumentsService } from '../services/outcome-documents.service';

// CONCEPT: functional ResolveFn | REACT: route `loader` / useQuery inside the page | INTERVIEW: the router waits for the data before activating the page, so the page never renders a half-loaded state; the result arrives as an input (withComponentInputBinding).
// OLD: @Injectable() class DeclarationResolver implements Resolve<DeclarationDetail> { resolve(route) { … } }
// Errors resolve to null (instead of cancelling navigation) so the page can show "Could not load".
export const declarationDetailResolver: ResolveFn<DeclarationDetail | null> = (route) => {
  const id = Number(route.paramMap.get('id'));
  if (!Number.isInteger(id) || id <= 0) return of(null);
  return inject(OutcomeDocumentsService)
    .getDeclarationById(id)
    .pipe(catchError(() => of(null)));
};
