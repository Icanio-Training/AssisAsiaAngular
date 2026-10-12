import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Ports of the React zod schemas (schemas/year.schema.ts, sectoralWorkPlan.schema.ts,
// followUpAction.schema.ts) as Angular validator functions.
//
// CONCEPT: custom validator function | REACT: z.string().regex(...).superRefine(...) | INTERVIEW: a ValidatorFn is just (control) => ValidationErrors | null — return null when valid, an error object (with a message) when not.
// OLD (class-based): @Directive({ providers: [{ provide: NG_VALIDATORS, useExisting: YearDirective, multi: true }] }) — only needed for template-driven forms.
//
// Every error object carries a `message` so templates can show it generically:
//   <mat-error>{{ errorMessage(control) }}</mat-error>

export const MIN_YEAR = 1900;
const FOUR_DIGITS = /^\d{4}$/;

/** Required, but whitespace-only counts as empty (zod's `.trim().min(1)`). */
export function trimmedRequired(message: string): ValidatorFn {
  return (control) => {
    const value: unknown = control.value;
    const empty = value === null || value === undefined || String(value).trim() === '';
    return empty ? { required: { message } } : null;
  };
}

/** A 4-digit year from 1900 up to `maxYear` (default: the current year; `null` = unbounded). */
export function yearValidator(options: { maxYear?: number | null } = {}): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '');
    if (value === '') return null; // "required" is a separate validator
    if (!FOUR_DIGITS.test(value)) return { year: { message: 'Enter a 4-digit year' } };
    const year = Number(value);
    // Read at validation time so the bound rolls over with the calendar year.
    const maxYear = options.maxYear === undefined ? new Date().getFullYear() : options.maxYear;
    if (year < MIN_YEAR || (maxYear !== null && year > maxYear)) {
      return {
        year: {
          message:
            maxYear === null
              ? `Enter a year of ${MIN_YEAR} or later`
              : `Enter a year between ${MIN_YEAR} and ${maxYear}`,
        },
      };
    }
    return null;
  };
}

// CONCEPT: cross-field (group) validator | REACT: zod `.refine(data => ..., { path: ['workplanComplete'] })` | INTERVIEW: put it on the FormGroup (not a control) so it can read sibling values; it re-runs whenever ANY child changes.
/** Workplan Complete must be after Workplan Start — error is set on the GROUP as `workplanOrder`. */
export const workplanOrderValidator: ValidatorFn = (group) => {
  const start = group.get('workplanStart')?.value as string | undefined;
  const complete = group.get('workplanComplete')?.value as string | undefined;
  if (!start || !complete) return null;
  return Number(complete) > Number(start)
    ? null
    : { workplanOrder: { message: 'Workplan Complete must be after Workplan Start' } };
};

/** "5.2", "SDG 5.2", "SDG5.2" — goal 1–17 with an optional target of up to 2 digits. */
export const SDG_VALUE_REGEX = /^(SDG\s*)?(1[0-7]|[1-9])(\.\d{1,2})?$/i;
export const SDG_VALUE_MESSAGE = 'SDG must be a goal 1–17 or a target, e.g. 5.2 or SDG 5.2';

export function formatSdg(value: string): string {
  const trimmed = value.trim();
  if (!SDG_VALUE_REGEX.test(trimmed)) return trimmed;
  return `SDG ${trimmed.replace(/^SDG\s*/i, '')}`;
}

/** Every SDG chip must match the regex (applied to the string[] control). */
export const sdgListValidator: ValidatorFn = (control) => {
  const values = (control.value ?? []) as readonly string[];
  const bad = values.find((v) => !SDG_VALUE_REGEX.test(v));
  return bad === undefined ? null : { sdg: { message: SDG_VALUE_MESSAGE, value: bad } };
};

/** At least `min` items in an array-valued control (chip multi-selects). */
export function minItems(min: number, message: string): ValidatorFn {
  return (control) => {
    const values = (control.value ?? []) as readonly unknown[];
    return values.length >= min ? null : { minItems: { message, min } };
  };
}

/** http(s) URL — zod's `z.url()` + the "must start with http(s)://" refine. */
export const httpUrlValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  try {
    new URL(value);
  } catch {
    return { url: { message: 'Enter a valid URL, e.g. https://asean.org/document.pdf' } };
  }
  return /^https?:\/\//i.test(value)
    ? null
    : { url: { message: 'The link must start with http:// or https://' } };
};

/** Digits only (Sectoral Work Plan "Number"). */
export const digitsOnlyValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '');
  return value === '' || /^\d+$/.test(value)
    ? null
    : { digits: { message: 'Number must contain digits only' } };
};

/** First human-readable message of a control's errors (all our validators set `message`). */
export function firstErrorMessage(errors: ValidationErrors | null | undefined): string | null {
  if (!errors) return null;
  for (const value of Object.values(errors)) {
    if (value && typeof value === 'object' && 'message' in value) {
      const message = (value as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
  }
  if ('required' in errors) return 'This field is required';
  return null;
}

/** Walks a form tree and returns the first error message found (for "fix the highlighted fields" toasts). */
export function firstFormError(control: AbstractControl): string | null {
  const own = firstErrorMessage(control.errors);
  if (own) return own;
  const children = 'controls' in control ? (control as { controls: unknown }).controls : null;
  if (!children) return null;
  const list = Array.isArray(children)
    ? (children as AbstractControl[])
    : Object.values(children as Record<string, AbstractControl>);
  for (const child of list) {
    const message = firstFormError(child);
    if (message) return message;
  }
  return null;
}
