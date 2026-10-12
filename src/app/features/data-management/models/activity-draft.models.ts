// Ported from the React app: src/features/data-management/types/activityDraft.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { WorkflowStep } from './workflow-action.models';

export interface ActivityDraftRequest {
  /** Present only when resubmitting an existing draft/revision-requested
      record — disambiguates which of the user's rows to update in place. */
  id?: number;
  sectoralBodyId: number | undefined;
  no: string;
  workplanStart: number | undefined;
  workplanComplete: number | undefined;
  programme: string;
  activity: string;
  activityTypeId: number | undefined;
  frequencyId: number | undefined;
  statusId: number | undefined;
  strategicMeasureIds: number[];
  indicator: string;
  remarks: string | null;
}

export interface ActivityDraftResponse {
  id: number;
  workflowStatus: 'draft' | 'pending_for_approval';
  currentStep: 'enterData' | 'reviewSubmit';
  no: string;
  sectoralBody: string;
  activity: string;
  status: string;
  correspondingStrategicMeasures: string[];
  displayStatus?: string;
  steps?: WorkflowStep[];
}

export interface ActivityUploadResponse {
  uploadId: number;
  userId: string;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  framework: {
    strategicGoals: number;
    objectives: number;
    strategicMeasures: number;
  };
  errors: string[];
}
