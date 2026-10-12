// Ported from the React app: src/features/data-management/types/workflowAction.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { SubmissionComment } from './submission-comment.models';

/** One role's position in the 3-step stepper, exactly as the admin API
    doc's approve/request-revision/reject/publish responses return it. */
export interface WorkflowStep {
  role: string;
  label: string;
  state: 'notReached' | 'current' | 'completed' | 'actionTaken' | 'rejected';
}

/** Shared response shape for every Content Manager / Admin review action
    (approve, request-revision, reject, publish) — same fields for both
    Activities and Declarations per the admin API doc. */
export interface WorkflowActionResponse {
  id: number;
  workflowStatus: string;
  displayStatus: string;
  steps: WorkflowStep[];
  comments: SubmissionComment[];
}
