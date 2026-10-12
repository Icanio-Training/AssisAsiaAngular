// Ported from the React app: src/features/data-management/types/activityDetail.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { ActivityDraftRequest } from './activity-draft.models';
import type { SubmissionComment } from './submission-comment.models';
import type { SubmissionCreatedBy } from './submission-creator.models';

/** Single-record shape from `GET /activities/{id}` — used by the read-only
    View Submission page. Fields the admin API doc's illustrative example
    omitted (`no`, `programme`, workflow status) are marked optional; the
    view renders `—` when they're absent rather than assuming they exist. */
export interface ActivityStrategicMeasure {
  id: number;
  code: string;
  label: string;
  name: string;
}

export interface StrategicGoalSummary {
  code: string;
  title: string;
  description: string;
}

export interface RelatedActivity {
  id: number;
  activity: string;
  status: string;
}

export interface ActivitySubmissionDetail {
  id: number;
  activity: string;
  sectoralBody: string;
  no?: string | undefined;
  status: string;
  activityType: string;
  frequency: string;
  workplanStart: number;
  workplanComplete: number;
  programme?: string | undefined;
  indicator: string | null;
  remarks: string | null;
  correspondingStrategicMeasures: ActivityStrategicMeasure[];
  workflowStatus?: string;
  displayStatus?: string;
  /** Present when a Content Manager / Admin has requested revision or
      rejected this submission — see `request-revision` / `reject` in the
      admin API doc, whose response includes this same `comments` array. */
  comments?: SubmissionComment[];
  /** Who submitted it — shown as the "Submitted by" line. Optional
      until the detail endpoint sends them (see `SubmissionCreator`). */
  createdBy?: SubmissionCreatedBy;
  /** Creator's role key on the GET-by-ID response (e.g. `admin`,
      `content_manager`) — folded into `createdBy` by `withCreatorRole` for
      the "Submitted by <name> (<role>)" line. */
  createdByRole?: string | null;
  /** The doc's "Get data by ID" fields — see `StrategicGoalSummary` above
      for why these weren't here before. */
  lastUpdate: string;
  workplanPeriod: string;
  activityCarryover: string | null;
  otherSectoralBody: string | null;
  strategicGoals: StrategicGoalSummary[];
  relatedActivities: RelatedActivity[];
}

/** `PUT /activities/{id}` body — the same field set the Enter Data / My
    Data edit form posts to `draftsOrSubmit` (see `buildActivityPayload`),
    minus the `id`, which rides in the URL instead. */
export type ActivityUpdateRequest = Omit<ActivityDraftRequest, 'id'>;
