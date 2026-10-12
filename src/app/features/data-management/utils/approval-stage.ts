// Ported from the React app: features/data-management/utils/approvalStage.ts (plain TS, logic unchanged).
// Drives the My Data / Submitted Data "Approval Status" stepper, the Status pill and review-action gating.
import { normalizeRoleKey } from './creator';

import type { ApprovalStatus } from '../models/my-data-list-item.models';
import type { WorkflowStep } from '../models/workflow-action.models';

/** Exact port of the HTML mockup's own `STAGE_ICONS` / `STATUS_COLORS` /
    icon-builder (`g`/`a`/`r`/`n`) logic for the My Data table's "Approval
    Status" 3-dot stepper and "Status" pill — same colors, same per-stage
    icon combinations, not an approximation. */
const GREEN = '#039855';
const AMBER = '#D4A017';
const RED = '#D92D20';
const GRAY_BG = '#EAECF0';
const GRAY_ICON = '#98A2B3';

export type IconShape = 'check' | 'cross';

export interface StageIcon {
  bg: string;
  color: string;
  shape: IconShape;
}

const g = (): StageIcon => ({ bg: GREEN, color: '#fff', shape: 'check' });
const a = (): StageIcon => ({ bg: AMBER, color: '#fff', shape: 'check' });
const r = (): StageIcon => ({ bg: RED, color: '#fff', shape: 'cross' });
const n = (): StageIcon => ({ bg: GRAY_BG, color: GRAY_ICON, shape: 'check' });

/** Which approval chain a record goes through:
    - `three-step` — Contributor submits → Content Manager reviews → Admin
      publishes (the default).
    - `two-step` — a Content Manager's own record: Content Manager submits →
      Admin publishes, with no separate Content Manager review. */
export type ApprovalFlow = 'three-step' | 'two-step';

/** Content Managers' records skip their own review step. `createdByRole` is
    the list row's creator role, when the API sends one — without it every
    row is treated as a Contributor's (three-step). */
export function approvalFlowForCreatorRole(createdByRole: string | undefined): ApprovalFlow {
  // The list API sends the display label ("Content Manager"), not the key.
  return normalizeRoleKey(createdByRole) === 'content_manager' ? 'two-step' : 'three-step';
}

export type WorkflowStage =
  | 'draft'
  | 'submitted'
  | 'cm-pending'
  | 'cm-revision'
  | 'cm-rejected'
  | 'admin-pending'
  | 'admin-revision'
  | 'admin-rejected'
  | 'published';

export interface StageInfo {
  icons: [StageIcon, StageIcon, StageIcon];
  statusLabel: string;
  /** The 3-dot stepper's own hover tooltip — the mockup's `STAGE_ICONS[stage].title`,
      distinct from `statusLabel` (the "Status" pill's text): CM- and
      Admin-stage pairs share the same `statusLabel` (e.g. both
      `cm-pending`/`admin-pending` show "Pending for Approval") but get a
      different, more specific `title` on hover. */
  title: string;
}

const STAGE_INFO: Record<WorkflowStage, StageInfo> = {
  draft: { icons: [n(), n(), n()], statusLabel: 'Draft', title: 'Draft' },
  submitted: {
    icons: [g(), n(), n()],
    statusLabel: 'Submitted',
    title: 'Submitted, awaiting Content Manager',
  },
  'cm-pending': {
    icons: [g(), a(), n()],
    statusLabel: 'Pending for Approval',
    title: 'Awaiting Content Manager review',
  },
  'cm-revision': {
    icons: [a(), a(), n()],
    statusLabel: 'Revision Requested',
    title: 'Content Manager requested revision',
  },
  'cm-rejected': {
    icons: [g(), r(), n()],
    statusLabel: 'Rejected',
    title: 'Rejected by Content Manager',
  },
  'admin-pending': {
    icons: [g(), g(), a()],
    statusLabel: 'Pending for Approval',
    title: 'Awaiting Admin',
  },
  'admin-revision': {
    icons: [a(), g(), a()],
    statusLabel: 'Revision Requested',
    title: 'Admin requested revision',
  },
  'admin-rejected': {
    icons: [g(), g(), r()],
    statusLabel: 'Rejected',
    title: 'Rejected by Admin',
  },
  published: { icons: [g(), g(), g()], statusLabel: 'Published', title: 'Published' },
};

export const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  Draft: { bg: '#F2F4F7', color: '#667085' },
  Submitted: { bg: '#EFF8FF', color: '#175CD3' },
  'Pending for Approval': { bg: '#FEF6E7', color: '#B54708' },
  'Revision Requested': { bg: '#FEF0E1', color: '#B54708' },
  Rejected: { bg: '#FEE4E2', color: '#CF1126' },
  Published: { bg: '#ECFDF3', color: '#027A48' },
};

/** Maps this app's `workflowStatus` values (see the admin API doc's status
    table) to the mockup's own stage keys — "submitted" has no direct
    equivalent in the documented workflow (it's the mockup's momentary
    post-upload state), so it's unused here. */
function workflowStatusToStage(workflowStatus: string): WorkflowStage {
  switch (workflowStatus) {
    case 'draft':
      return 'draft';
    case 'pending_for_approval':
      return 'cm-pending';
    case 'revision_requested_by_cm':
      return 'cm-revision';
    case 'rejected_by_cm':
      return 'cm-rejected';
    case 'pending_for_approval_admin':
      return 'admin-pending';
    case 'revision_requested_by_admin':
      return 'admin-revision';
    case 'rejected_by_admin':
      return 'admin-rejected';
    case 'published':
      return 'published';
    default:
      return 'draft';
  }
}

export function stageInfoForWorkflowStatus(workflowStatus: string): StageInfo {
  return STAGE_INFO[workflowStatusToStage(workflowStatus)];
}

/** One stepper circle's hover tooltip — exact copy from the Contributor /
    Content Manager Flow prototypes' `STEP_TIPS3` / `STEP_TIPS`. */
export interface StepTip {
  label: string;
  role: string;
  state: string;
  desc: string;
}

const tip = (label: string, role: string) => (state: string, desc: string) => ({
  label,
  role,
  state,
  desc,
});

/** Three-step chain (Contributor's records) — prototype `STEP_TIPS3` (Contributor Flow_2 wording). */
const STEP_TIPS_THREE: Record<WorkflowStage, [StepTip, StepTip, StepTip]> = (() => {
  const s1 = tip('Step 1 · Submission', 'Contributor');
  const s2 = tip('Step 2 · Review', 'Content Manager');
  const s3 = tip('Step 3 · Final approval', 'Admin');
  const cmWait = s2('Not started', 'Content Manager review begins after the record is submitted.');
  const adWait = s3(
    'Not started',
    'Admin review begins after the Content Manager approves the record.',
  );
  const sub = s1('Submitted', 'Submitted for review.');
  const cmOk = s2('Approved', 'Approved by the Content Manager.');
  return {
    draft: [
      s1('Not submitted yet', 'Saved as a draft. Submit the record to begin the review.'),
      cmWait,
      adWait,
    ],
    submitted: [sub, s2('Next to review', 'Awaiting review by the Content Manager.'), adWait],
    'cm-pending': [
      sub,
      s2(
        'Under review',
        'The Content Manager is reviewing the record and will approve it or request a revision or reject it.',
      ),
      adWait,
    ],
    'cm-revision': [
      s1('Revision required', 'Review the comments, update the record and resubmit.'),
      s2('Revision requested', 'The Content Manager has requested changes.'),
      adWait,
    ],
    'cm-rejected': [
      sub,
      s2('Rejected', 'Rejected by the Content Manager. The workflow has ended.'),
      s3('Not started', 'No Admin review is required.'),
    ],
    'admin-pending': [
      sub,
      cmOk,
      s3(
        'Under review',
        'The Admin is reviewing the record and will publish it or request a revision or reject it.',
      ),
    ],
    'admin-revision': [
      s1(
        'Revision required',
        'Review the comments, update the record and resubmit. The Admin will review the revised submission.',
      ),
      cmOk,
      s3('Revision requested', 'The Admin has requested changes.'),
    ],
    'admin-rejected': [sub, cmOk, s3('Rejected', 'Rejected by the Admin. The workflow has ended.')],
    published: [sub, cmOk, s3('Published', 'Published by the Admin.')],
  };
})();

/** Two-step chain (Content Manager's own records) — prototype `STEP_TIPS`. */
const STEP_TIPS_TWO: Record<WorkflowStage, [StepTip, StepTip]> = (() => {
  const s1 = tip('Step 1 · Submission', 'Content Manager');
  const s2 = tip('Step 2 · Admin review', 'Admin');
  const notYet = s2('Not started', 'Admin review has not started.');
  return {
    draft: [
      s1('Not submitted yet', 'Saved as a draft. Submit the record to begin the review.'),
      s2('Not started', 'Admin review begins after the record is submitted.'),
    ],
    submitted: [s1('Submitted', 'Submitted for review.'), notYet],
    'cm-pending': [
      s1('Submitted', 'Submitted for review.'),
      s2('Pending approval', 'Awaiting review by the Admin.'),
    ],
    'cm-revision': [
      s1(
        'Returned for changes',
        'Changes have been requested. Review the comments, update the record and resubmit.',
      ),
      notYet,
    ],
    'cm-rejected': [
      s1(
        'Rejected by Content Manager',
        'The workflow has ended. This record will not be published.',
      ),
      notYet,
    ],
    'admin-pending': [
      s1('Submitted', 'Submitted for review.'),
      s2(
        'Under review',
        'The Admin is reviewing the record and will publish it or request a revision or reject it.',
      ),
    ],
    'admin-revision': [
      s1('Returned for changes', 'Review the comments, update the record and resubmit for review.'),
      s2('Revision requested', 'The Admin has requested changes before publishing.'),
    ],
    'admin-rejected': [
      s1('Submitted', 'Submitted for review.'),
      s2('Rejected', 'Rejected by the Admin. The workflow has ended.'),
    ],
    published: [
      s1('Submitted', 'Submitted for review.'),
      s2('Published', 'Published by the Admin.'),
    ],
  };
})();

/** Two-step circle colors — prototype `STAGE_ICONS` (two-dot variant). */
const TWO_STEP_ICONS: Record<WorkflowStage, [StageIcon, StageIcon]> = {
  draft: [n(), n()],
  submitted: [g(), n()],
  'cm-pending': [g(), a()],
  'cm-revision': [a(), n()],
  'cm-rejected': [r(), n()],
  'admin-pending': [g(), a()],
  'admin-revision': [a(), a()],
  'admin-rejected': [g(), r()],
  published: [g(), g()],
};

/** "Status" pill tooltip, three-step chain — prototype `STATUS_DEFS3`. */
const STATUS_DEFS_THREE: Record<WorkflowStage, string> = {
  draft: 'Saved but not yet submitted. You can continue editing.',
  submitted: 'Submitted to the Content Manager for review.',
  'cm-pending': 'Under review by the Content Manager. A decision is pending.',
  'cm-revision':
    'The Content Manager has requested changes. Review the comments, update the record and resubmit.',
  'cm-rejected':
    'Rejected by the Content Manager and will not be published. Review the comments for details.',
  'admin-pending':
    'Approved by the Content Manager and under review by the Admin. A decision is pending.',
  'admin-revision':
    'The Admin has requested changes. Review the comments, update the record and resubmit.',
  'admin-rejected':
    'Rejected by the Admin and will not be published. Review the comments for details.',
  published: 'Approved and published by the Admin. It is now live and visible on the Dashboard.',
};

/** "Status" pill tooltip, two-step chain — prototype `STATUS_DEFS` (keyed
    by the pill's label, as in the prototype). */
const STATUS_DEFS_TWO: Record<string, string> = {
  Draft: 'Saved but not yet submitted. You can continue editing.',
  Submitted: 'Submitted to the Admin for review.',
  'Pending for Approval': 'Under review by the Admin. A decision is pending.',
  'Revision Requested':
    'The Admin has requested changes. Review the comments, update the record and resubmit.',
  Rejected: 'Rejected by the Admin and will not be published. Review the comments for details.',
  Published: 'Approved and published by the Admin. It is now live and visible on the Dashboard.',
};

/** Best-effort stage for a row with no `workflowStatus` (only the pill's
    label) — a label shared by a CM/Admin pair resolves to the stage that
    flow actually reaches. */
function stageForStatusLabel(statusLabel: string, flow: ApprovalFlow): WorkflowStage {
  const reviewer = flow === 'two-step' ? 'admin' : 'cm';
  switch (statusLabel) {
    case 'Submitted':
      return 'submitted';
    case 'Pending for Approval':
      return `${reviewer}-pending`;
    case 'Revision Requested':
      return `${reviewer}-revision`;
    case 'Rejected':
      return `${reviewer}-rejected`;
    case 'Published':
      return 'published';
    default:
      return 'draft';
  }
}

export interface StepperStep {
  icon: StageIcon;
  tip: StepTip;
}

export interface StepperInfo {
  steps: StepperStep[];
  /** Accessible summary of the whole stepper, e.g. "Awaiting Admin". */
  title: string;
}

/** Everything the "Approval Status" column renders for one row: each
    circle's colors + hover tooltip, for the row's approval chain. */
export function stepperInfo(
  flow: ApprovalFlow,
  workflowStatus: string | undefined,
  approvalStatus: ApprovalStatus | undefined,
): StepperInfo {
  const fallback = stageInfoForApprovalStatus(approvalStatus);
  const stage = workflowStatus
    ? workflowStatusToStage(workflowStatus)
    : stageForStatusLabel(fallback.statusLabel, flow);
  const title = workflowStatus ? STAGE_INFO[stage].title : fallback.statusLabel;

  if (flow === 'two-step') {
    const [icon1, icon2] = TWO_STEP_ICONS[stage];
    const [tip1, tip2] = STEP_TIPS_TWO[stage];
    return {
      title,
      steps: [
        { icon: icon1, tip: tip1 },
        { icon: icon2, tip: tip2 },
      ],
    };
  }
  const [icon1, icon2, icon3] = workflowStatus ? STAGE_INFO[stage].icons : fallback.icons;
  const [tip1, tip2, tip3] = STEP_TIPS_THREE[stage];
  return {
    title,
    steps: [
      { icon: icon1, tip: tip1 },
      { icon: icon2, tip: tip2 },
      { icon: icon3, tip: tip3 },
    ],
  };
}

/** The "Status" pill's hover description for a row's approval chain. */
export function statusDescriptionFor(
  flow: ApprovalFlow,
  workflowStatus: string | undefined,
  statusLabel: string,
): string {
  if (flow === 'two-step') return STATUS_DEFS_TWO[statusLabel] ?? '';
  const stage = workflowStatus
    ? workflowStatusToStage(workflowStatus)
    : stageForStatusLabel(statusLabel, flow);
  return STATUS_DEFS_THREE[stage];
}

export function workflowStepsForStatus(workflowStatus: string): WorkflowStep[] {
  switch (workflowStatus) {
    case 'pending_for_approval':
      return [
        { role: 'contributor', label: 'Contributor', state: 'completed' },
        { role: 'content_manager', label: 'Content Manager', state: 'current' },
        { role: 'admin', label: 'Admin', state: 'notReached' },
      ];
    case 'revision_requested_by_cm':
      return [
        { role: 'contributor', label: 'Contributor', state: 'current' },
        { role: 'content_manager', label: 'Content Manager', state: 'actionTaken' },
        { role: 'admin', label: 'Admin', state: 'notReached' },
      ];
    case 'rejected_by_cm':
      return [
        { role: 'contributor', label: 'Contributor', state: 'completed' },
        { role: 'content_manager', label: 'Content Manager', state: 'rejected' },
        { role: 'admin', label: 'Admin', state: 'notReached' },
      ];
    case 'pending_for_approval_admin':
      return [
        { role: 'contributor', label: 'Contributor', state: 'completed' },
        { role: 'content_manager', label: 'Content Manager', state: 'completed' },
        { role: 'admin', label: 'Admin', state: 'current' },
      ];
    case 'revision_requested_by_admin':
      return [
        { role: 'contributor', label: 'Contributor', state: 'current' },
        { role: 'content_manager', label: 'Content Manager', state: 'completed' },
        { role: 'admin', label: 'Admin', state: 'actionTaken' },
      ];
    case 'rejected_by_admin':
      return [
        { role: 'contributor', label: 'Contributor', state: 'completed' },
        { role: 'content_manager', label: 'Content Manager', state: 'completed' },
        { role: 'admin', label: 'Admin', state: 'rejected' },
      ];
    case 'published':
      return [
        { role: 'contributor', label: 'Contributor', state: 'completed' },
        { role: 'content_manager', label: 'Content Manager', state: 'completed' },
        { role: 'admin', label: 'Admin', state: 'completed' },
      ];
    case 'draft':
    default:
      return [
        { role: 'contributor', label: 'Contributor', state: 'current' },
        { role: 'content_manager', label: 'Content Manager', state: 'notReached' },
        { role: 'admin', label: 'Admin', state: 'notReached' },
      ];
  }
}

export interface ReviewActions {
  canApprove: boolean;
  canPublish: boolean;
  canRequestRevision: boolean;
  canReject: boolean;
}

const NO_ACTIONS: ReviewActions = {
  canApprove: false,
  canPublish: false,
  canRequestRevision: false,
  canReject: false,
};

/** Which review actions a role may take on a Submitted Data record right
    now — exact mirror of the admin API doc's role/status pairing: a
    Content Manager acts only while `pending_for_approval` (approve /
    request-revision / reject), an Admin only while
    `pending_for_approval_admin` (publish / request-revision / reject).
    Any other combination — including the acting role's own stage having
    already moved on — is read-only. */
export function reviewActionsForRole(role: string, workflowStatus: string): ReviewActions {
  if (role === 'content_manager' && workflowStatus === 'pending_for_approval') {
    return { canApprove: true, canPublish: false, canRequestRevision: true, canReject: true };
  }
  if (role === 'admin' && workflowStatus === 'pending_for_approval_admin') {
    return { canApprove: false, canPublish: true, canRequestRevision: true, canReject: true };
  }
  return NO_ACTIONS;
}

function iconForStepStatus(status: string): StageIcon {
  switch (status) {
    case 'completed':
      return g();
    case 'current':
      return a();
    case 'rejected':
      return r();
    default:
      return n();
  }
}

/** Generic fallback for when only the row's step statuses are known (no
    exact `workflowStatus` to look up in `STAGE_INFO`) — no `title` here
    since a CM-stage/Admin-stage pair (e.g. `cm-pending`/`admin-pending`)
    is indistinguishable from `steps` alone; `ApprovalStatusStepper` prefers
    `stageInfoForWorkflowStatus`'s exact `title` whenever it has a
    `workflowStatus` to look up. */
export interface ApprovalStepIcons {
  icons: [StageIcon, StageIcon, StageIcon];
  statusLabel: string;
}

export function stageInfoForApprovalStatus(
  approvalStatus: ApprovalStatus | undefined,
): ApprovalStepIcons {
  const [first, second, third] = approvalStatus?.steps ?? [];
  const icons: [StageIcon, StageIcon, StageIcon] = [
    first ? iconForStepStatus(first.status) : n(),
    second ? iconForStepStatus(second.status) : n(),
    third ? iconForStepStatus(third.status) : n(),
  ];
  return { icons, statusLabel: approvalStatus?.current ?? 'Draft' };
}

export function approvalStatusFixtureForWorkflowStatus(workflowStatus: string): ApprovalStatus {
  const step = (name: string, status: string) => ({ name, status });
  switch (workflowStatus) {
    case 'pending_for_approval':
      return {
        current: 'Pending for Approval',
        steps: [
          step('Submitted', 'completed'),
          step('Under Review', 'current'),
          step('Approved', 'pending'),
        ],
      };
    case 'pending_for_approval_admin':
      return {
        current: 'Pending for Approval',
        steps: [
          step('Submitted', 'completed'),
          step('Under Review', 'completed'),
          step('Approved', 'current'),
        ],
      };
    case 'revision_requested_by_cm':
      return {
        current: 'Revision Requested',
        steps: [
          step('Submitted', 'current'),
          step('Under Review', 'current'),
          step('Approved', 'pending'),
        ],
      };
    case 'revision_requested_by_admin':
      return {
        current: 'Revision Requested',
        steps: [
          step('Submitted', 'current'),
          step('Under Review', 'completed'),
          step('Approved', 'current'),
        ],
      };
    case 'rejected_by_cm':
      return {
        current: 'Rejected',
        steps: [
          step('Submitted', 'completed'),
          step('Under Review', 'rejected'),
          step('Approved', 'pending'),
        ],
      };
    case 'rejected_by_admin':
      return {
        current: 'Rejected',
        steps: [
          step('Submitted', 'completed'),
          step('Under Review', 'completed'),
          step('Approved', 'rejected'),
        ],
      };
    case 'published':
      return {
        current: 'Published',
        steps: [
          step('Submitted', 'completed'),
          step('Under Review', 'completed'),
          step('Approved', 'completed'),
        ],
      };
    case 'draft':
    default:
      return {
        current: 'Draft',
        steps: [
          step('Submitted', 'pending'),
          step('Under Review', 'pending'),
          step('Approved', 'pending'),
        ],
      };
  }
}
