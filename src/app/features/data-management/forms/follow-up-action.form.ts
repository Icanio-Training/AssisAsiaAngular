import type {
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
} from '@angular/forms';

import { AMS_COUNTRIES } from '../constants/countries';
import type { DeclarationDraftRequest } from '../models/declaration-draft.models';
import {
  httpUrlValidator,
  minItems,
  sdgListValidator,
  trimmedRequired,
  yearValidator,
} from '../validators/form.validators';

// Tool 2 — Follow Up Action. Replaces React's followUpAction.schema.ts + useFieldArray().
//
// CONCEPT: FormArray + nested FormArray | REACT: useFieldArray({ name: 'nationalImplementations' }) and, per card, useFieldArray({ name: `nationalImplementations.${i}.items` }) | INTERVIEW: FormArray holds a dynamic list of controls; push()/removeAt() add/remove rows and the array's value/validity aggregate automatically.

export type ImplementationItemForm = FormGroup<{ text: FormControl<string> }>;

export type NationalImplementationForm = FormGroup<{
  country: FormControl<string>;
  code: FormControl<string>;
  items: FormArray<ImplementationItemForm>;
}>;

export type FollowUpActionForm = FormGroup<{
  title: FormControl<string>;
  implementingSectoralBodyIds: FormControl<string[]>;
  sectorId: FormControl<string>;
  followUpStatus: FormControl<string>;
  fileUrl: FormControl<string>;
  typeId: FormControl<string>;
  adoptionLevelId: FormControl<string>;
  year: FormControl<string>;
  chairId: FormControl<string>;
  sectoralBodyEntity: FormControl<string>;
  sdgs: FormControl<string[]>;
  remarks: FormControl<string>;
  isPublic: FormControl<boolean>;
  regionalImplementations: FormArray<ImplementationItemForm>;
  nationalImplementations: FormArray<NationalImplementationForm>;
}>;

export type FollowUpActionValues = ReturnType<FollowUpActionForm['getRawValue']>;

export function createImplementationItem(
  fb: NonNullableFormBuilder,
  text = '',
): ImplementationItemForm {
  return fb.group({ text: fb.control(text, trimmedRequired('Cannot be empty')) });
}

function createNationalImplementation(
  fb: NonNullableFormBuilder,
  country: { name: string; code: string },
  items: readonly string[] = [],
): NationalImplementationForm {
  return fb.group({
    country: fb.control(country.name),
    code: fb.control(country.code),
    items: fb.array(items.map((text) => createImplementationItem(fb, text))),
  });
}

export interface FollowUpActionFormOptions {
  /** Async "title already exists" check — see validators/title-available.validator.ts. */
  readonly titleAvailable?: AsyncValidatorFn;
}

export function createFollowUpActionForm(
  fb: NonNullableFormBuilder,
  options: FollowUpActionFormOptions = {},
): FollowUpActionForm {
  return fb.group({
    title: fb.control('', {
      validators: [trimmedRequired('Title of Declaration is required')],
      ...(options.titleAvailable ? { asyncValidators: [options.titleAvailable] } : {}),
      // Async validators run on every change by default; 'blur' keeps the API quiet while typing.
      updateOn: 'blur',
    }),
    implementingSectoralBodyIds: fb.control<string[]>(
      [],
      minItems(1, 'Select at least one Implementing Sectoral Body'),
    ),
    sectorId: fb.control('', trimmedRequired('Sector is required')),
    followUpStatus: fb.control('', trimmedRequired('Status is required')),
    fileUrl: fb.control('', [
      trimmedRequired('Enter a valid URL, e.g. https://asean.org/document.pdf'),
      httpUrlValidator,
    ]),
    typeId: fb.control('', trimmedRequired('Type of Document is required')),
    adoptionLevelId: fb.control('', trimmedRequired('Adoption is required')),
    year: fb.control('', [trimmedRequired('Year of Declaration is required'), yearValidator()]),
    chairId: fb.control('', trimmedRequired('Adopting Body Chair is required')),
    sectoralBodyEntity: fb.control('', trimmedRequired('Sectoral Body / Entity is required')),
    sdgs: fb.control<string[]>([], [minItems(1, 'Select at least one SDG'), sdgListValidator]),
    remarks: fb.control(''),
    isPublic: fb.control(false),
    regionalImplementations: fb.array<ImplementationItemForm>([]),
    // One card per ASEAN member state, each with its own nested FormArray of items.
    nationalImplementations: fb.array(
      AMS_COUNTRIES.map((c) => createNationalImplementation(fb, c)),
    ),
  });
}

/**
 * Load a record into the form (edit pages).
 *
 * CONCEPT: setValue vs patchValue | REACT: reset(values) / defaultValues | INTERVIEW: setValue needs EVERY key and throws on a missing one (strict); patchValue updates only the keys you pass. Neither adds FormArray rows — rebuild arrays first, then patch.
 */
export function loadFollowUpActionValues(
  fb: NonNullableFormBuilder,
  form: FollowUpActionForm,
  values: FollowUpActionValues,
): void {
  const regional = form.controls.regionalImplementations;
  regional.clear({ emitEvent: false });
  for (const item of values.regionalImplementations) {
    regional.push(createImplementationItem(fb, item.text), { emitEvent: false });
  }
  const national = form.controls.nationalImplementations;
  national.clear({ emitEvent: false });
  for (const entry of values.nationalImplementations) {
    national.push(
      createNationalImplementation(
        fb,
        { name: entry.country, code: entry.code },
        entry.items.map((i) => i.text),
      ),
      { emitEvent: false },
    );
  }
  // Arrays now have the right length, so setValue (all keys, strict) is safe.
  form.setValue(values);
}

/** DTO builder — identical to React's `buildDeclarationPayload`. */
export function buildDeclarationPayload(values: FollowUpActionValues): DeclarationDraftRequest {
  return {
    title: values.title.trim(),
    implementingSectoralBodyIds: values.implementingSectoralBodyIds.map(Number),
    sectorId: Number(values.sectorId),
    followUpStatus: values.followUpStatus,
    fileUrl: values.fileUrl,
    typeId: Number(values.typeId),
    adoption_level_id: Number(values.adoptionLevelId),
    year: Number(values.year),
    chairId: Number(values.chairId),
    sectoralBodyEntity: values.sectoralBodyEntity.trim(),
    sdgs: values.sdgs,
    remarks: values.remarks ?? null,
    isPublic: values.isPublic,
    regionalImplementations: values.regionalImplementations
      .map((item) => item.text.trim())
      .filter((text) => text !== ''),
    nationalImplementations: values.nationalImplementations
      .map((n) => ({
        country: n.country,
        code: n.code,
        items: n.items.map((item) => item.text.trim()).filter((text) => text !== ''),
      }))
      .filter((n) => n.items.length > 0),
  };
}
