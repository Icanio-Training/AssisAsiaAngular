// Ported from the React app: src/features/data-management/types/submissionComment.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

/** A single reviewer comment, exactly as the admin API doc's workflow
    action responses (approve/reject/request-revision) return them.
    Attached to a submission's detail record so the View Submission page
    can show a Content Manager / Admin's reason for a rejection or
    revision request. */
export interface SubmissionComment {
  role: string;
  user: string;
  action: string;
  comment: string;
  createdAt: string;
}
