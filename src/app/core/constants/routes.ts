// CONCEPT: `as const` object | REACT: same file (src/constants/routes.ts) | INTERVIEW: `as const` makes every value a readonly literal type, so a typo like ROUTES.INITATIVES is a compile error.
// Only the routes in this migration's scope: login, the three "Database" tools
// and Data Management. Parameterised links are built as arrays in Angular:
//   [routerLink]="[ROUTES.INITIATIVES_ACTIVITIES, activity.id]"
export const ROUTES = {
  LOGIN: '/login',
  CALLBACK: '/callback',
  FORGOT_PASSWORD: '/forgot-password',

  /** Landing page after login — "Database → Tool 1". */
  INITIATIVES: '/initiatives',
  INITIATIVES_ACTIVITIES: '/initiatives/activities',

  OUTCOME_DOCUMENTS: '/outcome-documents',
  OUTCOME_DOCUMENTS_MATRIX: '/outcome-documents/matrix',

  BLUEPRINT_KPI: '/blueprint-kpi',

  DATA_MANAGEMENT: '/data-management',

  PRACTICE_STUDENTS: '/practice/students',
  NOT_FOUND: '/not-found',
} as const;

/** Where a user lands after signing in (React sent them to the home page). */
export const POST_LOGIN_ROUTE = ROUTES.INITIATIVES;
