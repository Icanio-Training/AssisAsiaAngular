import { Pipe, type PipeTransform } from '@angular/core';

// CONCEPT: custom PURE pipe | REACT: calling a helper in JSX — {initialsOf(user.name)} | INTERVIEW: a pure pipe re-runs only when its input REFERENCE changes (cached like computed); calling a method in a template would run on every change detection.
// Pure (default) vs impure (`pure: false`): impure pipes run on every check — needed only for
// mutable inputs (e.g. the built-in `async` pipe). Pure pipes are why immutable updates matter:
// mutating an array in place keeps the same reference, so a pure pipe would NOT re-run.
//
// Usage: {{ user.name | initials }}  → "Aisha Rahman" → "AR"
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined, max = 2): string {
    return (name ?? '')
      .split(' ')
      .filter((part) => /^[A-Za-z]/.test(part))
      .slice(0, max)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
