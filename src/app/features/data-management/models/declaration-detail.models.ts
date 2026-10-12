// Ported from the React app: src/features/data-management/types/declarationDetail.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { DeclarationDraftRequest } from './declaration-draft.models';
import type { SubmissionComment } from './submission-comment.models';
import type { SubmissionCreatedBy } from './submission-creator.models';

/** Single-record shape from `GET /declarations/{id}` — used by the read-only
    View Submission page for the Follow Up Actions tool. Same
    optional-field caveat as activityDetail.types.ts: the admin API doc's
    illustrative example doesn't show every field the create/draft payload
    has, so the view renders `—` for anything absent. */
export interface DeclarationSubmissionCountryActions {
  code: string;
  name: string;
  count: number;
  actions: string[];
}

export interface DeclarationSectoralBody {
  name: string;
  sector: string;
}

export interface DeclarationSubmissionDetail {
  id: number;
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
  regionalActions: string[];
  countries: DeclarationSubmissionCountryActions[];
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
  declarationNo: string;
  level: string;
  summit: string;
  regionalActionsCount: number;
  nationalActionsCount: number;
  hasFollowUpActions: boolean;
  sectoralBodies: DeclarationSectoralBody[];
  position: { current: number; total: number };
}

/** `PUT /declarations/{id}` body — the same field set the Enter Data / My
    Data edit form posts to `draftsOrSubmit` (see `buildDeclarationPayload`),
    minus the `id`, which rides in the URL instead. */
export type DeclarationUpdateRequest = Omit<DeclarationDraftRequest, 'id'>;
