import { HttpClient, type HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, type Observable, shareReplay, switchMap } from 'rxjs';

import { toHttpParams } from '@core/http/api-params';

import { DATA_MANAGEMENT_ENDPOINTS } from '../constants/endpoints';
import type {
  ActivitySubmissionDetail,
  ActivityUpdateRequest,
} from '../models/activity-detail.models';
import type {
  ActivityDraftRequest,
  ActivityDraftResponse,
  ActivityUploadResponse,
} from '../models/activity-draft.models';
import type {
  ActivityListItem,
  MyDataListQueryParams,
  MyDataListResponse,
  SubmittedActivityListResponse,
} from '../models/my-data-list-item.models';
import type { WorkflowActionResponse } from '../models/workflow-action.models';
import {
  approvalStatusFixtureForWorkflowStatus,
  stageInfoForWorkflowStatus,
} from '../utils/approval-stage';
import { creatorFields } from '../utils/creator';
import { mapSubmittedListPagination } from '../utils/list-pagination';
import { normalizeUploadErrors } from '../utils/upload';
import { assertSpreadsheet, toUploadEvents, type UploadEvent } from './upload-events';

const ENDPOINTS = DATA_MANAGEMENT_ENDPOINTS.activities;

export interface DropdownOption {
  id: number;
  name: string;
}

interface RawActivityUploadResponse {
  uploadId: number;
  userId: string;
  imported_count: number;
  skipped_count: number;
  duplicate_count: number;
  framework?: { strategic_goals: number; objectives: number; strategic_measures: number };
  errors: unknown[];
}

export function mapActivityUploadResponse(raw: RawActivityUploadResponse): ActivityUploadResponse {
  return {
    uploadId: raw.uploadId,
    userId: raw.userId,
    importedCount: raw.imported_count,
    skippedCount: raw.skipped_count,
    duplicateCount: raw.duplicate_count,
    framework: {
      strategicGoals: raw.framework?.strategic_goals ?? 0,
      objectives: raw.framework?.objectives ?? 0,
      strategicMeasures: raw.framework?.strategic_measures ?? 0,
    },
    errors: normalizeUploadErrors(raw.errors),
  };
}

function mapList(raw: SubmittedActivityListResponse): MyDataListResponse<ActivityListItem> {
  return {
    items: raw.items.map((item) => ({
      id: item.id,
      activity: item.activity,
      sectoralBody: item.sectoralBody,
      lastUpdatedOn: item.lastUpdate,
      approvalStatus: approvalStatusFixtureForWorkflowStatus(item.workflowStatus),
      status: stageInfoForWorkflowStatus(item.workflowStatus).statusLabel,
      type: item.activityType,
      frequency: item.frequency,
      workflowStatus: item.workflowStatus,
      objective: item.objective,
      strategicMeasure: item.strategicMeasure,
      objectives: item.objectives,
      strategicMeasures: item.strategicMeasures,
      createdBy: item.createdBy ?? undefined,
      createdByRole: item.createdByRole ?? undefined,
    })),
    pagination: mapSubmittedListPagination(raw.pagination),
  };
}

/** `activities/details` pages by `limit` (it ignores perPage); newest first. */
function toActivityListParams(params: MyDataListQueryParams) {
  const { perPage, ...rest } = params;
  return { ...rest, limit: perPage, sortBy: 'lastUpdate', sortDir: 'desc' };
}

// CONCEPT: service with HttpClient | REACT: `activitiesService` object calling `apiClient` (axios) + TanStack Query | INTERVIEW: Observables are lazy — nothing is sent until someone subscribes (async pipe, toSignal, subscribe()).
@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly http = inject(HttpClient);

  // CONCEPT: shareReplay caching | REACT: TanStack `staleTime: 5 * 60 * 1000` | INTERVIEW: shareReplay({ bufferSize: 1, refCount: false }) runs the request ONCE and replays the last value to every later subscriber.
  readonly workflowStatusOptions$ = this.http
    .get<DropdownOption[]>(ENDPOINTS.dropdown, {
      params: toHttpParams({ filter: 'workflowStatus', sortDir: 'desc' }),
    })
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  saveDraft(payload: ActivityDraftRequest): Observable<ActivityDraftResponse> {
    return this.http.post<ActivityDraftResponse>(ENDPOINTS.draftsOrSubmit, payload, {
      params: toHttpParams({ action: 'draft' }),
    });
  }

  submitForApproval(payload: ActivityDraftRequest): Observable<ActivityDraftResponse> {
    return this.http.post<ActivityDraftResponse>(ENDPOINTS.draftsOrSubmit, payload, {
      params: toHttpParams({ action: 'submit' }),
    });
  }

  uploadFile(file: File): Observable<UploadEvent<ActivityUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<RawActivityUploadResponse>(ENDPOINTS.upload, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(toUploadEvents(mapActivityUploadResponse));
  }

  downloadTemplate(): Observable<Blob> {
    return this.http
      .get(ENDPOINTS.template, { responseType: 'blob', observe: 'response' })
      .pipe(switchMap((response: HttpResponse<Blob>) => from(assertSpreadsheet(response))));
  }

  getById(id: number): Observable<ActivitySubmissionDetail> {
    return this.http.get<ActivitySubmissionDetail>(ENDPOINTS.byId(id)).pipe(
      map((detail) => ({
        ...detail,
        ...creatorFields(detail.createdBy, detail.createdByRole),
        correspondingStrategicMeasures: detail.correspondingStrategicMeasures ?? [],
        strategicGoals: detail.strategicGoals ?? [],
        relatedActivities: detail.relatedActivities ?? [],
      })),
    );
  }

  /** PUT — edits a published record in place (no approval pipeline). */
  updateById(id: number, payload: ActivityUpdateRequest): Observable<ActivitySubmissionDetail> {
    return this.http.put<ActivitySubmissionDetail>(ENDPOINTS.byId(id), payload);
  }

  getMyList(params: MyDataListQueryParams = {}): Observable<MyDataListResponse<ActivityListItem>> {
    return this.http
      .get<SubmittedActivityListResponse>(ENDPOINTS.listDetails, {
        params: toHttpParams(toActivityListParams(params)),
      })
      .pipe(map(mapList));
  }

  getSubmittedList(
    params: MyDataListQueryParams = {},
  ): Observable<MyDataListResponse<ActivityListItem>> {
    return this.http
      .get<SubmittedActivityListResponse>(ENDPOINTS.listDetails, {
        params: toHttpParams({ ...toActivityListParams(params), workflow: 'submittedData' }),
      })
      .pipe(map(mapList));
  }

  approve(id: number): Observable<WorkflowActionResponse> {
    return this.http.post<WorkflowActionResponse>(ENDPOINTS.approve(id), {});
  }

  requestRevision(id: number, comment: string): Observable<WorkflowActionResponse> {
    return this.http.post<WorkflowActionResponse>(ENDPOINTS.requestRevision(id), { comment });
  }

  reject(id: number, comment: string | undefined): Observable<WorkflowActionResponse> {
    return this.http.post<WorkflowActionResponse>(ENDPOINTS.reject(id), comment ? { comment } : {});
  }

  publish(id: number): Observable<WorkflowActionResponse> {
    return this.http.post<WorkflowActionResponse>(ENDPOINTS.publish(id), {});
  }
}
