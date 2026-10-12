// Ported from the React app: src/features/data-management/types/myDataListItem.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

import type { Role } from '@core/auth/auth.models';

export interface ApprovalStatusStep {
  name: string;
  status: string;
}

export interface ApprovalStatus {
  current: string;
  steps: ApprovalStatusStep[];
}

export interface ActivityListItem {
  id: number;
  activity: string;
  sectoralBody: string;
  lastUpdatedOn: string;
  approvalStatus: ApprovalStatus | undefined;
  status: string;
  type: string;
  frequency: string | null;
  createdBy?: string | undefined;
  /** Creator's role key from the list API (`contributor` / `content_manager` / `admin`) — a Content Manager's row shows the two-step approval chain (see `approvalFlowForCreatorRole`). */
  createdByRole?: string | undefined;
  objective?: string;
  strategicMeasure?: string;
  objectives?: string[];
  strategicMeasures?: string[];
  workflowStatus?: string;
}

export interface DeclarationListItem {
  id: number;
  title: string;
  sector: string;
  lastUpdatedOn: string;
  approvalStatus: ApprovalStatus | undefined;
  status: string;
  type: string;
  createdBy?: string | undefined;
  /** Creator's role key from the list API (`contributor` / `content_manager` / `admin`) — a Content Manager's row shows the two-step approval chain (see `approvalFlowForCreatorRole`). */
  createdByRole?: string | undefined;
  workflowStatus?: string;
  declarationNo?: string;
  level?: string;
  year?: number;
  chair?: string;
  regionalAseanLevel?: number;
  national?: number;
  total?: number;
}

export interface MyDataPagination {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface MyDataListResponse<T> {
  roleName?: Role;
  items: T[];
  pagination: MyDataPagination;
}

export interface MyDataListQueryParams {
  page?: number | undefined;
  perPage?: number | undefined;
  search?: string | undefined;
  sectoralBody?: string | undefined;
  status?: string | undefined;
  frequency?: string | undefined;
  activityType?: string | undefined;
}

export interface SubmittedActivityListItem {
  id: number;
  lastUpdate: string;
  activity: string;
  sectoralBody: string;
  status: string;
  activityType: string;
  frequency: string | null;
  workflowStatus: string;
  approvalStatus: string;
  objective: string;
  strategicMeasure: string;
  objectives: string[];
  strategicMeasures: string[];
  createdBy: string | null;
  /** Creator's role key — see `ActivityListItem.createdByRole`. */
  createdByRole?: string | null;
}

export interface SubmittedListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
}

export interface SubmittedActivityListResponse {
  pagination: SubmittedListPagination;
  items: SubmittedActivityListItem[];
}

/** Confirmed against a real `GET /declarations/filter` response body. `status`
    is always `null` in that sample — `stageInfoForWorkflowStatus`/
    `approvalStatusFixtureForWorkflowStatus` derive the app-level `status`/
    `approvalStatus` from `workflowStatus` instead, same as activities. */
export interface SubmittedDeclarationListItem {
  id: number;
  declarationNo: string;
  lastUpdateOn: number;
  title: string;
  sector: string;
  type: string;
  level: string;
  year: number;
  chair: string;
  status: string | null;
  regionalAseanLevel: number;
  national: number;
  total: number;
  workflowStatus: string;
  approvalStatus: string;
  createdBy: string | null;
  /** Creator's role key — see `ActivityListItem.createdByRole`. */
  createdByRole?: string | null;
}

/** Confirmed against a real response: pagination fields are flat siblings
    of `items` (`page`/`pageSize`/`totalRecords`/`totalPages`) inside the
    `data` envelope `apiClient`'s interceptor unwraps — NOT nested under a
    `pagination` object, and not the same field names as
    `SubmittedListPagination` (activities' `/activities/details`, which
    remains an unconfirmed guess). There's no `showingFrom`/`showingTo`
    here either; `mapDeclarationFilterPagination` computes them the same
    way `mapListPagination` does for the plain list endpoints. */
export interface SubmittedDeclarationListResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: SubmittedDeclarationListItem[];
}
