// Ported from the React app: src/features/data-management/types/wizard.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

export type ToolGroup = 'initiatives' | 'outcomes';

export type StepperGroup = 'Choose database' | 'Enter data' | 'Review & submit';

export type EnterDataMethod = 'form' | 'upload';

export type WizardStepNumber = 1 | 2 | 3;

export type StepperStepStatus = 'Completed' | 'In Progress' | 'Pending';

export interface StepperStep {
  id: number;
  name: string;
  orderno: number;
  status: StepperStepStatus;
}

export interface StepperResponse {
  userId: string;
  group: string;
  steps: StepperStep[];
}

export type DraftSubmitAction = 'draft' | 'submit';
