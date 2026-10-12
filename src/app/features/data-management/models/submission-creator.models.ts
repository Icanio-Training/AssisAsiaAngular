// Ported from the React app: src/features/data-management/types/submissionCreator.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

/** Who submitted a record, as returned on the activity / declaration
    "Get data by ID" responses. The list endpoints already send `createdBy`
    as a bare string (an email); the detail endpoints are expected to send
    either that same string or a richer object — both are accepted. */
export interface SubmissionCreator {
  name?: string | null;
  email?: string | null;
  /** snake_case role key, e.g. `focal_point`, `content_manager`. */
  role?: string | null;
}

export type SubmissionCreatedBy = SubmissionCreator | string | null;
