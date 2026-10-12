import { Pipe, type PipeTransform } from '@angular/core';

// CONCEPT: custom pure pipe | REACT: a helper called in JSX — {gradeLetter(score)} (or useMemo) | INTERVIEW: pure pipes run again ONLY when the input value/reference changes — Angular caches the result, unlike a method call in the template that runs on every change detection.
// Usage: {{ 87 | gradeLetter }} → "A"     {{ score | gradeLetter: true }} → "A (Excellent)"
@Pipe({ name: 'gradeLetter' })
export class GradeLetterPipe implements PipeTransform {
  transform(grade: number | null | undefined, withLabel = false): string {
    if (grade === null || grade === undefined || Number.isNaN(grade)) return '—';
    const [letter, label] =
      grade >= 85
        ? ['A', 'Excellent']
        : grade >= 70
          ? ['B', 'Good']
          : grade >= 55
            ? ['C', 'Satisfactory']
            : grade >= 40
              ? ['D', 'Pass']
              : ['F', 'Fail'];
    return withLabel ? `${letter} (${label})` : letter;
  }
}
