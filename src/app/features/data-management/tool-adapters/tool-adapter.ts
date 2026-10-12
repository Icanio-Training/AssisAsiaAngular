import { InjectionToken, type Type } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import type { Observable } from 'rxjs';

import type { ToolGroup } from '../models/wizard.models';
import type { UploadEvent } from '../services/upload-events';
import type { UploadResult } from '../utils/upload';

// CONCEPT: Strategy / Tool Adapter pattern | REACT: constants/toolAdapters.ts — a Record<toolId, { schema, FormComponent, ReviewComponent, saveDraft, submit, … }> | INTERVIEW: the wizard knows NOTHING about Tool 1 vs Tool 2; it asks the registry for an adapter and renders whatever components/forms the adapter supplies. Adding Tool 4 = adding one adapter.
//
// Methods use METHOD syntax on purpose: TypeScript checks method parameters bivariantly, so a
// ToolAdapter<SectoralWorkPlanForm> is assignable to the registry's ToolAdapter<FormGroup>.
export interface ToolAdapter<TForm extends FormGroup = FormGroup> {
  readonly group: ToolGroup;
  readonly templateFilename: string;
  /** Save as Draft validates only this field (drafts are meant to be incomplete). */
  readonly draftRequiredField: { readonly name: string; readonly label: string };
  /** Rendered with NgComponentOutlet; receives the FormGroup through its `form` input. */
  readonly formComponent: Type<unknown>;
  readonly reviewComponent: Type<unknown>;

  /** A fresh FormGroup (with validators) for one wizard session. */
  createForm(): TForm;
  saveDraft(form: TForm): Observable<unknown>;
  submit(form: TForm): Observable<{ id: number }>;
  uploadFile(file: File): Observable<UploadEvent<UploadResult>>;
  downloadTemplate(): Observable<Blob>;
}

export type ToolAdapterRegistry = Readonly<Record<string, ToolAdapter>>;

// CONCEPT: InjectionToken | REACT: importing the TOOL_ADAPTERS constant directly | INTERVIEW: a token lets you inject things that aren't classes (objects, functions, config) and lets tests/routes swap the value without touching the consumer.
export const TOOL_ADAPTERS = new InjectionToken<ToolAdapterRegistry>(
  'DataManagement.TOOL_ADAPTERS',
);
