import type { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';

import type { ActivityDraftRequest } from '../models/activity-draft.models';
import {
  digitsOnlyValidator,
  trimmedRequired,
  workplanOrderValidator,
  yearValidator,
} from '../validators/form.validators';

// Tool 1 — Sectoral Work Plan. Replaces React's sectoralWorkPlan.schema.ts (zod) + useForm().
//
// CONCEPT: typed reactive forms | REACT: react-hook-form `useForm<SectoralWorkPlanFormValues>({ resolver: zodResolver(schema) })` | INTERVIEW: since v14 FormGroup is generic — `form.controls.activity` is FormControl<string>, `getRawValue()` is fully typed, typos are compile errors.
// OLD (untyped): new FormGroup({ activity: new FormControl('') }) → value was `any`. UntypedFormGroup is the migration escape hatch.

export type SectoralWorkPlanForm = FormGroup<{
  sectoralBodyId: FormControl<string>;
  no: FormControl<string>;
  workplanStart: FormControl<string>;
  workplanComplete: FormControl<string>;
  programme: FormControl<string>;
  activity: FormControl<string>;
  activityTypeId: FormControl<string>;
  frequencyId: FormControl<string>;
  statusId: FormControl<string>;
  strategicMeasureIds: FormControl<string[]>;
  indicator: FormControl<string>;
  remarks: FormControl<string>;
}>;

/** Plain value shape (ids are strings while editing, like the React form). */
export type SectoralWorkPlanValues = ReturnType<SectoralWorkPlanForm['getRawValue']>;

export const SECTORAL_WORK_PLAN_DEFAULTS: SectoralWorkPlanValues = {
  sectoralBodyId: '',
  no: '',
  workplanStart: '',
  workplanComplete: '',
  programme: '',
  activity: '',
  activityTypeId: '',
  frequencyId: '',
  statusId: '',
  strategicMeasureIds: [],
  indicator: '',
  remarks: '',
};

// CONCEPT: NonNullableFormBuilder | REACT: defaultValues | INTERVIEW: with fb.nonNullable, reset() goes back to the INITIAL value instead of null, so FormControl<string> never becomes string | null.
export function createSectoralWorkPlanForm(fb: NonNullableFormBuilder): SectoralWorkPlanForm {
  return fb.group(
    {
      sectoralBodyId: fb.control('', trimmedRequired('Sectoral Body is required')),
      no: fb.control('', [trimmedRequired('Number is required'), digitsOnlyValidator]),
      workplanStart: fb.control('', [trimmedRequired('Enter a 4-digit year'), yearValidator()]),
      workplanComplete: fb.control('', [
        trimmedRequired('Enter a 4-digit year'),
        yearValidator({ maxYear: null }),
      ]),
      programme: fb.control('', trimmedRequired('Programme is required')),
      activity: fb.control('', trimmedRequired('Activity is required')),
      activityTypeId: fb.control('', trimmedRequired('Activity Type is required')),
      frequencyId: fb.control('', trimmedRequired('Frequency of Activity is required')),
      statusId: fb.control('', trimmedRequired('Status of Activity is required')),
      strategicMeasureIds: fb.control<string[]>([]),
      indicator: fb.control('', trimmedRequired('Indicator is required')),
      remarks: fb.control(''),
    },
    // Group-level validator: needs BOTH year fields.
    { validators: [workplanOrderValidator] },
  );
}

/** DTO builder — identical to React's `buildActivityPayload` (string ids → Number). */
export function buildActivityPayload(values: SectoralWorkPlanValues): ActivityDraftRequest {
  return {
    sectoralBodyId: Number(values.sectoralBodyId),
    no: values.no,
    workplanStart: Number(values.workplanStart),
    workplanComplete: Number(values.workplanComplete),
    // zod's `.trim()` transformed these on submit in React.
    programme: values.programme.trim(),
    activity: values.activity.trim(),
    activityTypeId: Number(values.activityTypeId),
    frequencyId: Number(values.frequencyId),
    statusId: Number(values.statusId),
    strategicMeasureIds: values.strategicMeasureIds.map(Number),
    indicator: values.indicator.trim(),
    remarks: values.remarks ?? null,
  };
}
