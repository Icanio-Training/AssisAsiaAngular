import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable, shareReplay } from 'rxjs';

import { FILTER_KEYS } from '../constants/outcome-documents.constants';
import type { DropdownFilterKey, DropdownOption } from '../models/outcome-documents.models';
import { OutcomeDocumentsService } from './outcome-documents.service';

export type DeclarationDropdowns = Record<DropdownFilterKey, DropdownOption[]>;

@Injectable({ providedIn: 'root' })
export class DeclarationDropdownsService {
  private readonly api = inject(OutcomeDocumentsService);

  // CONCEPT: forkJoin | REACT: await Promise.all(FILTER_KEYS.map(getDropdownOptions)) | INTERVIEW: forkJoin subscribes to all inputs in parallel and emits ONCE, when every one has completed (one error fails the whole join).
  // CONCEPT: shareReplay({ bufferSize: 1, refCount: false }) | REACT: TanStack Query cache (staleTime 5 min) | INTERVIEW: the first subscriber triggers the 7 requests; later subscribers get the cached result. refCount:false keeps the cache even when nobody is subscribed.
  private cache$: Observable<DeclarationDropdowns> | null = null;

  /** All 7 dropdowns, keyed by filter. Requested once per session, then served from cache.
      (shareReplay resets on error, so a failed load is retried by the next subscriber.) */
  getAll(): Observable<DeclarationDropdowns> {
    this.cache$ ??= this.load().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.cache$;
  }

  private load(): Observable<DeclarationDropdowns> {
    const requests = Object.fromEntries(
      FILTER_KEYS.map((key) => [key, this.api.getDropdownOptions(key)]),
    ) as Record<DropdownFilterKey, Observable<DropdownOption[]>>;
    // forkJoin with an OBJECT keeps the keys: { year: [...], country: [...], ... }
    return forkJoin(requests).pipe(
      map((result) => {
        // Errored / null responses fall back to an empty option list per key.
        const safe = { ...result };
        for (const key of FILTER_KEYS) safe[key] = result[key] ?? [];
        return safe;
      }),
    );
  }
}
