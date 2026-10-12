import { HttpClient, type HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, type Observable, shareReplay, switchMap } from 'rxjs';

import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADING, withFlags } from '@core/http/http-context';
import { toHttpParams } from '@core/http/api-params';

import { DATA_MANAGEMENT_ENDPOINTS } from '../constants/endpoints';
import type {
  DeclarationSectoralBody,
  DeclarationSubmissionCountryActions,
  DeclarationSubmissionDetail,
  DeclarationUpdateRequest,
} from '../models/declaration-detail.models';
import type {
  DeclarationDraftRequest,
  DeclarationDraftResponse,
  DeclarationSubmitResponse,
  DeclarationUploadResponse,
} from '../models/declaration-draft.models';
import type {
  DeclarationListItem,
  MyDataListQueryParams,
  MyDataListResponse,
  SubmittedDeclarationListResponse,
} from '../models/my-data-list-item.models';
import type { WorkflowActionResponse } from '../models/workflow-action.models';
import {
  approvalStatusFixtureForWorkflowStatus,
  stageInfoForWorkflowStatus,
} from '../utils/approval-stage';
import { creatorFields } from '../utils/creator';
import { mapDeclarationFilterPagination } from '../utils/list-pagination';
import { normalizeUploadErrors } from '../utils/upload';
import type { DropdownOption } from './activities.service';
import { assertSpreadsheet, toUploadEvents, type UploadEvent } from './upload-events';

const ENDPOINTS = DATA_MANAGEMENT_ENDPOINTS.declarations;

interface RawDeclarationUploadResponse {
  uploadId: number;
  userId: string;
  imported_count: number;
  skipped_count: number;
  duplicate_count: number;
  errors: unknown[];
}

function mapUpload(raw: RawDeclarationUploadResponse): DeclarationUploadResponse {
  return {
    uploadId: raw.uploadId,
    userId: raw.userId,
    importedCount: raw.imported_count,
    skippedCount: raw.skipped_count,
    duplicateCount: raw.duplicate_count,
    errors: normalizeUploadErrors(raw.errors),
  };
}

/** `GET/PUT /declarations/{id}` can arrive using the public detail page's field names
    (`summit`, `remark`, `availableToPublic`, `sectoralBodies`) — the alias mapping below
    is identical to React's `mapDeclarationSubmissionDetail`. */
export interface RawDeclarationSubmissionDetail extends Omit<
  DeclarationSubmissionDetail,
  | 'implementingSectoralBodies'
  | 'sectoralBodyEntity'
  | 'remarks'
  | 'isPublic'
  | 'sdgs'
  | 'regionalActions'
  | 'countries'
  | 'sectoralBodies'
> {
  implementingSectoralBodies?: string[] | string;
  sectoralBodyEntity?: string;
  remarks?: string | null;
  isPublic?: boolean;
  sdgs?: string[] | string;
  regionalActions?: string[] | string;
  countries?: DeclarationSubmissionCountryActions[];
  sectoralBodies?: DeclarationSectoralBody[];
  remark?: string | null;
  availableToPublic?: boolean;
}

function toStringList(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function mapDeclarationSubmissionDetail(
  raw: RawDeclarationSubmissionDetail,
): DeclarationSubmissionDetail {
  const sectoralBodies = raw.sectoralBodies ?? [];
  const implementing = toStringList(raw.implementingSectoralBodies);
  return {
    ...raw,
    implementingSectoralBodies:
      implementing.length > 0 ? implementing : sectoralBodies.map((b) => b.name),
    sectoralBodyEntity: raw.sectoralBodyEntity ?? raw.summit ?? '',
    remarks: raw.remarks !== undefined ? raw.remarks : (raw.remark ?? null),
    isPublic: raw.isPublic ?? raw.availableToPublic ?? false,
    ...creatorFields(raw.createdBy, raw.createdByRole),
    sdgs: toStringList(raw.sdgs),
    regionalActions: toStringList(raw.regionalActions),
    countries: raw.countries ?? [],
    sectoralBodies,
  };
}

function mapList(raw: SubmittedDeclarationListResponse): MyDataListResponse<DeclarationListItem> {
  return {
    items: raw.items.map((item) => ({
      id: item.id,
      title: item.title,
      sector: item.sector,
      lastUpdatedOn: String(item.lastUpdateOn),
      approvalStatus: approvalStatusFixtureForWorkflowStatus(item.workflowStatus),
      status: stageInfoForWorkflowStatus(item.workflowStatus).statusLabel,
      type: item.type,
      workflowStatus: item.workflowStatus,
      declarationNo: item.declarationNo,
      level: item.level,
      year: item.year,
      chair: item.chair,
      regionalAseanLevel: item.regionalAseanLevel,
      national: item.national,
      total: item.total,
      createdBy: item.createdBy ?? undefined,
      createdByRole: item.createdByRole ?? undefined,
    })),
    pagination: mapDeclarationFilterPagination(raw),
  };
}

/** `declarations/filter` pages by `pageSize` (NOT `limit` like activities). */
function toDeclarationFilterParams(params: MyDataListQueryParams) {
  const { perPage, ...rest } = params;
  return { ...rest, pageSize: perPage, sortBy: 'lastUpdateOn', sortDir: 'desc' };
}

@Injectable({ providedIn: 'root' })
export class DeclarationsService {
  private readonly http = inject(HttpClient);

  private options(filter: string, sortDir?: string): Observable<DropdownOption[]> {
    return this.http
      .get<DropdownOption[]>(ENDPOINTS.dropdown, { params: toHttpParams({ filter, sortDir }) })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  /** My Data / Submitted Data "Status" filter. */
  readonly workflowStatusOptions$ = this.options('workflowStatus', 'desc');
  /** Tool 2 form "Status" field (values are names). */
  readonly statusOptions$ = this.options('status');
  /** "Data Availability" filter. */
  readonly dataAvailabilityOptions$ = this.options('dataAvailability', 'desc');

  saveDraft(payload: DeclarationDraftRequest): Observable<DeclarationDraftResponse> {
    return this.http.post<DeclarationDraftResponse>(ENDPOINTS.draftsOrSubmit, payload, {
      params: toHttpParams({ action: 'draft' }),
    });
  }

  submitForApproval(payload: DeclarationDraftRequest): Observable<DeclarationSubmitResponse> {
    return this.http.post<DeclarationSubmitResponse>(ENDPOINTS.draftsOrSubmit, payload, {
      params: toHttpParams({ action: 'submit' }),
    });
  }

  uploadFile(file: File): Observable<UploadEvent<DeclarationUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<RawDeclarationUploadResponse>(ENDPOINTS.upload, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(toUploadEvents(mapUpload));
  }

  downloadTemplate(): Observable<Blob> {
    return this.http
      .get(ENDPOINTS.template, { responseType: 'blob', observe: 'response' })
      .pipe(switchMap((response: HttpResponse<Blob>) => from(assertSpreadsheet(response))));
  }

  getById(id: number): Observable<DeclarationSubmissionDetail> {
    return this.http
      .get<RawDeclarationSubmissionDetail>(ENDPOINTS.byId(id))
      .pipe(map(mapDeclarationSubmissionDetail));
  }

  updateById(
    id: number,
    payload: DeclarationUpdateRequest,
  ): Observable<DeclarationSubmissionDetail> {
    return this.http
      .put<RawDeclarationSubmissionDetail>(ENDPOINTS.byId(id), payload)
      .pipe(map(mapDeclarationSubmissionDetail));
  }

  getMyList(
    params: MyDataListQueryParams = {},
  ): Observable<MyDataListResponse<DeclarationListItem>> {
    return this.http
      .get<SubmittedDeclarationListResponse>(ENDPOINTS.listFilter, {
        params: toHttpParams(toDeclarationFilterParams(params)),
      })
      .pipe(map(mapList));
  }

  getSubmittedList(
    params: MyDataListQueryParams = {},
  ): Observable<MyDataListResponse<DeclarationListItem>> {
    return this.http
      .get<SubmittedDeclarationListResponse>(ENDPOINTS.listFilter, {
        params: toHttpParams({ ...toDeclarationFilterParams(params), workflow: 'submittedData' }),
      })
      .pipe(map(mapList));
  }

  /** Titles matching `search` — backs the async "title already exists" validator. */
  findTitles(search: string): Observable<{ id: number; title: string }[]> {
    return this.http
      .get<SubmittedDeclarationListResponse>(ENDPOINTS.listFilter, {
        params: toHttpParams({ search, pageSize: 20 }),
        // Background check: no global progress bar, no error toast.
        context: withFlags(SKIP_GLOBAL_LOADING, SKIP_ERROR_TOAST),
      })
      .pipe(map((res) => res.items.map(({ id, title }) => ({ id, title }))));
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
