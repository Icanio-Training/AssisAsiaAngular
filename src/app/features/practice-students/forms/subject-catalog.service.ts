import { Injectable, signal } from '@angular/core';

let instances = 0;

// CONCEPT: component-level provider | REACT: a Context.Provider rendered inside one component (each mount = new value) | INTERVIEW: `providedIn: 'root'` = ONE app-wide singleton; `providers: [X]` on a @Component = a NEW instance for every instance of that component (and its children), destroyed with it.
// No `providedIn` here on purpose: it is ONLY available where a component lists it in `providers`.
// StudentFormPage does — so opening "New" twice gives two separate catalogs (see `instanceNo`).
@Injectable()
export class SubjectCatalog {
  /** Increments per instance — shown on the form to prove each page gets its own. */
  readonly instanceNo = ++instances;

  readonly suggestions: readonly string[] = [
    'Algorithms',
    'Databases',
    'Networks',
    'Web Development',
    'Accounting',
    'Marketing',
    'Economics',
    'Statistics',
    'Mechanics',
    'Circuits',
    'Typography',
    'UX Research',
  ];

  private readonly _added = signal<string[]>([]);
  /** Subjects typed on THIS form instance only. */
  readonly added = this._added.asReadonly();

  remember(name: string): void {
    const clean = name.trim();
    if (clean && !this._added().includes(clean)) this._added.update((list) => [...list, clean]);
  }
}
