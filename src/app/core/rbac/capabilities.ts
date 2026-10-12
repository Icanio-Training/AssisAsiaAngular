// Ported from the React app: src/lib/rbac/capabilities.ts (unchanged logic).
// CONCEPT: role → capability map | REACT: same file | INTERVIEW: check capabilities ('initiatives:review'), not roles, in the UI — adding a role then means editing ONE table.

import type { Role } from '@core/auth/auth.models';

export type Capability =
  | 'initiatives:view'
  | 'initiatives:create'
  | 'initiatives:edit-own'
  | 'initiatives:edit-any'
  | 'initiatives:submit'
  | 'initiatives:review'
  | 'initiatives:delete-any'
  | 'outcome-documents:view'
  | 'outcome-documents:landing:view'
  | 'blueprint-kpi:view'
  | 'blueprint-kpi:edit'
  | 'cms:manage'
  | 'users:manage'
  | 'data-management:access'
  | 'data-management:review'
  | 'data-management:publish';

/** Explicit per-role capability list — content_manager and contributor diverge, so this
    isn't expressible as a single privilege rank. */
export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  /* Public may enter the outcome-documents route (the data zone) but not
     the landing/explore banner. `outcome-documents:view` is the route
     gate only — document APIs and landing chrome stay behind
     `outcome-documents:landing:view` (authenticated roles). */
  public: ['outcome-documents:view'],
  guest: [
    'initiatives:view',
    'outcome-documents:view',
    'outcome-documents:landing:view',
    'blueprint-kpi:view',
  ],
  contributor: [
    'initiatives:view',
    'initiatives:create',
    'initiatives:edit-own',
    'initiatives:submit',
    'outcome-documents:view',
    'outcome-documents:landing:view',
    'blueprint-kpi:view',
    'data-management:access',
  ],
  content_manager: [
    'initiatives:view',
    'initiatives:review',
    'outcome-documents:view',
    'outcome-documents:landing:view',
    'blueprint-kpi:view',
    'data-management:access',
    'data-management:review',
  ],
  admin: [
    'initiatives:view',
    'initiatives:create',
    'initiatives:edit-own',
    'initiatives:edit-any',
    'initiatives:submit',
    'initiatives:review',
    'initiatives:delete-any',
    'outcome-documents:view',
    'outcome-documents:landing:view',
    'blueprint-kpi:view',
    'blueprint-kpi:edit',
    'cms:manage',
    'users:manage',
    'data-management:access',
    'data-management:review',
    'data-management:publish',
  ],
};
