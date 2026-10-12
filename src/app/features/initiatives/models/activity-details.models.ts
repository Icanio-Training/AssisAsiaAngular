// Ported from the React app: src/features/initiatives/types/activityDetails.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { ActivityStatus } from './initiatives.models';

export interface ActivityLookup {
  id: number;
  label: string;
}

export interface ActivityDetailItem {
  id: number;
  lastUpdate: string;
  activity: string;
  sectoralBody: string;
  status: ActivityStatus;
  activityType: string;
  frequency: string;
  workplanCycle: string;
  objective: ActivityLookup;
  strategicMeasure: ActivityLookup;
  year: number;
}

/** Echoes both filtering mechanisms the backend resolves: the manual
    5-group Filters panel (period/activityType/frequency/status/
    sectoralBody — all multi-select, all numeric ids) and the chart-drill
    params (objective/strategicMeasure/year — single-value, applied when
    arriving from a dashboard chart click rather than the manual panel). */
export interface ActivityDetailsFilters {
  period: number[];
  activityType: number[];
  frequency: number[];
  status: number[];
  sectoralBody: number[];
  objective: string | null;
  strategicMeasure: string | null;
  year: number | null;
}

export interface ActivityDetailsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
}

export interface ActivityDetailsResponse {
  filters: ActivityDetailsFilters;
  pagination: ActivityDetailsPagination;
  items: ActivityDetailItem[];
}

/** Single-record shape from `GET /api/v1/activities/{id}` — a superset of
    the list row (`ActivityDetailItem`), not a reuse of it: several fields
    here (workplanStart/workplanComplete as separate numbers, carryover,
    indicator, remarks) only exist on the detail response. Flat, matching
    the real endpoint exactly — it does not nest these under a sub-object
    the way an earlier version of this type assumed. */
export interface StrategicGoalSummary {
  code: string;
  title: string;
  description: string;
}

/** One row per linked measure — the real endpoint returns a rich object
    per measure (id/code/label/name), not the two flat code-string arrays
    an earlier version of this type assumed. */
export interface CorrespondingStrategicMeasure {
  id: number;
  code: string;
  label: string;
  name: string;
}

export interface RelatedActivity {
  id: number;
  activity: string;
  status: ActivityStatus;
}

export interface ActivityDetail {
  id: number;
  lastUpdate?: string | null;
  asOf?: string | null;
  activity: string;
  sectoralBody: string;
  status: ActivityStatus;
  activityType: string;
  workplanPeriod: string;
  frequency: string;
  workplanStart: number;
  workplanComplete: number;
  activityCarryover: string | null;
  indicator: string | null;
  remarks: string | null;
  otherSectoralBody: string | null;
  strategicGoals: StrategicGoalSummary[];
  correspondingStrategicMeasures: CorrespondingStrategicMeasure[];
  relatedActivities: RelatedActivity[];
}

export type ActivityDetailResponse = ActivityDetail;

export interface ActivityDetailsQueryParams {
  period?: number[] | undefined;
  activityType?: number[] | undefined;
  frequency?: number[] | undefined;
  status?: number[] | undefined;
  sectoralBody?: number[] | undefined;
  objective?: number | undefined;
  strategicMeasure?: number | undefined;
  year?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?:
    | 'lastUpdate'
    | 'activity'
    | 'sectoralBody'
    | 'status'
    | 'activityType'
    | 'frequency'
    | undefined;
  sortDir?: 'asc' | 'desc' | undefined;
}
