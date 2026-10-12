import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { Y_AXIS_LIMIT, Y_AXIS_MIN_INTERVAL } from '../constants/countries';

// Ports of the zod rules in React's schemas/asccKpi.schema.ts (axisNumber, yInterval and the
// chart `superRefine`: Max > Min, ascending years, numeric/in-range cells for ACTIVE slots only).

/** Required number within ±Y_AXIS_LIMIT. */
export function axisNumberValidator(label: string): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '').trim();
    if (value === '') return { axis: { message: `${label} is required` } };
    if (!Number.isFinite(Number(value))) return { axis: { message: `${label} must be a number` } };
    if (Math.abs(Number(value)) > Y_AXIS_LIMIT) {
      return { axis: { message: `${label} must be between -${Y_AXIS_LIMIT} and ${Y_AXIS_LIMIT}` } };
    }
    return null;
  };
}

export const yIntervalValidator: ValidatorFn = (control) => {
  const value = Number(String(control.value ?? '').trim());
  return value >= Y_AXIS_MIN_INTERVAL
    ? null
    : { interval: { message: `Interval must be at least ${Y_AXIS_MIN_INTERVAL}` } };
};

/** Shape the group validator reads — kept structural so it can be unit-tested with plain values. */
interface ChartRuleInput {
  yMin: string;
  yMax: string;
  baselineYear: string;
  midtermYears: string[];
  endtermYear: string;
  rows: { cells: Record<string, { value: string } | undefined> }[];
}

/** Path → message, e.g. { 'yMax': 'Max must be greater than Min', 'midtermYears.1': '…', 'rows.3.cells.baseline.value': '…' } */
export type ChartRuleErrors = Record<string, string>;

function activeSlotKeys(chart: ChartRuleInput): string[] {
  const keys: string[] = [];
  if (chart.baselineYear) keys.push('baseline');
  chart.midtermYears.forEach((year, i) => {
    if (year) keys.push(`midterm-${i}`);
  });
  if (chart.endtermYear) keys.push('endterm');
  return keys;
}

/** Pure function version of the zod superRefine — returns every issue keyed by its field path. */
export function chartRuleErrors(chart: ChartRuleInput): ChartRuleErrors {
  const errors: ChartRuleErrors = {};

  if (Number(chart.yMin) >= Number(chart.yMax)) errors['yMax'] = 'Max must be greater than Min';

  // X axis: baseline < every midterm (ascending, no repeats) < end term. Unset slots are skipped.
  const baseline = chart.baselineYear ? Number(chart.baselineYear) : null;
  const endterm = chart.endtermYear ? Number(chart.endtermYear) : null;
  let previous: number | null = null;
  chart.midtermYears.forEach((raw, i) => {
    if (!raw) return;
    const year = Number(raw);
    const path = `midtermYears.${i}`;
    if (baseline !== null && year <= baseline) {
      errors[path] = 'Midterm year must be after the baseline year';
    } else if (endterm !== null && year >= endterm) {
      errors[path] = 'Midterm year must be before the end term year';
    } else if (previous !== null && year <= previous) {
      errors[path] = 'Midterm years must be in ascending order, without repeats';
    }
    previous = year;
  });
  if (baseline !== null && endterm !== null && endterm <= baseline) {
    errors['endtermYear'] = 'End term year must be after the baseline year';
  }

  // Data table: optional values, but an entered value must be a number inside the Y range.
  const min = Number(chart.yMin);
  const max = Number(chart.yMax);
  const hasRange = Number.isFinite(min) && Number.isFinite(max) && min < max;
  for (const key of activeSlotKeys(chart)) {
    chart.rows.forEach((row, r) => {
      const raw = (row.cells[key]?.value ?? '').trim();
      if (raw === '') return;
      const value = Number(raw);
      const path = `rows.${r}.cells.${key}.value`;
      if (!Number.isFinite(value)) errors[path] = 'Enter a number';
      else if (hasRange && (value < min || value > max))
        errors[path] = `Must be between ${min} and ${max}`;
    });
  }
  return errors;
}

// CONCEPT: group validator replacing zod superRefine | REACT: chartSchema.superRefine((chart, ctx) => ctx.addIssue({ path })) | INTERVIEW: a group validator can't put an error ON a child control, so it returns a path→message map on the group; the template looks messages up by path.
export const chartRulesValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const errors = chartRuleErrors(group.getRawValue() as ChartRuleInput);
  return Object.keys(errors).length > 0 ? { chartRules: errors } : null;
};

/** Message for one path inside a chart group, e.g. chartRuleError(chart, 'midtermYears.0'). */
export function chartRuleError(group: AbstractControl, path: string): string | null {
  const rules = group.errors?.['chartRules'] as ChartRuleErrors | undefined;
  return rules?.[path] ?? null;
}
