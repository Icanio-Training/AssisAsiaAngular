// Ported from the React app: src/features/data-management/types/declarationDraft.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { WorkflowStep } from './workflow-action.models';

export interface NationalImplementationInput {
  country: string;
  code: string;
  items: string[];
}

export interface DeclarationDraftRequest {
  /** Present only when resubmitting an existing draft/revision-requested
      record — disambiguates which of the user's rows to update in place. */
  id?: number;
  title: string;
  implementingSectoralBodyIds: number[];
  sectorId: number | undefined;
  followUpStatus: string;
  fileUrl: string;
  typeId: number | undefined;
  /** Id from `GET declarations/dropdown?filter=level` — the one snake_case
      key in this body, as the backend expects it. */
  adoption_level_id: number | undefined;
  year: number | undefined;
  chairId: number | undefined;
  sectoralBodyEntity: string;
  sdgs: string[];
  remarks: string | null;
  isPublic: boolean;
  regionalImplementations: string[];
  nationalImplementations: NationalImplementationInput[];
}

export interface NationalImplementationCount {
  country: string;
  code: string;
  count: number;
}

export interface DeclarationDraftResponse {
  id: number;
  workflowStatus: 'draft' | 'pending_for_approval';
  currentStep: 'enterData' | 'reviewSubmit';
  title: string;
  implementingSectoralBodies: string[];
  sector: string;
  followUpStatus: string;
  fileUrl: string;
  type: string;
  adoption: string;
  year: number;
  chair: string;
  sectoralBodyEntity: string;
  sdgs: string[];
  remarks: string | null;
  isPublic: boolean;
  regionalCount: number;
  nationalCount: number;
  regionalImplementations: string[];
  nationalImplementations: NationalImplementationCount[];
  lastUpdate: string;
}

export interface DeclarationSubmitResponse {
  id: number;
  workflowStatus: 'pending_for_approval';
  displayStatus: string;
  steps: WorkflowStep[];
  currentStep: 'reviewSubmit';
}

export interface DeclarationUploadResponse {
  uploadId: number;
  userId: string;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  errors: string[];
}
