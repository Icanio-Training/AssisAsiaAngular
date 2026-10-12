import { HttpClient, type HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, type Observable, switchMap } from 'rxjs';

import { DASHBOARD_ENDPOINTS } from '@core/constants/dashboard-endpoints';
import { type QueryParams, toHttpParams } from '@core/http/api-params';
import { SKIP_ERROR_TOAST, withFlags } from '@core/http/http-context';

import { DECLARATION_ENDPOINTS } from '../constants/outcome-documents.constants';
import type {
  DeclarationDetail,
  DeclarationQuery,
  DropdownFilterKey,
  DropdownResponse,
  FilterResponse,
  OutcomeChartsResponse,
  OutcomeSummaryResponse,
} from '../models/outcome-documents.models';

/** `GET declarations/{id}` sends `isPublic` / `remarks`; the page reads `availableToPublic` / `remark`. */
type RawDeclarationDetail = Omit<DeclarationDetail, 'availableToPublic' | 'remark'> & {
  isPublic?: boolean;
  availableToPublic?: boolean;
  remarks?: string | null;
  remark?: string | null;
};

/** Same params React sent: page/pageSize, non-empty filter id arrays, trimmed search, sort pair. */
export function filterQueryParams(query: DeclarationQuery): QueryParams {
  const params: QueryParams = { page: query.page, pageSize: query.pageSize };
  for (const [key, ids] of Object.entries(query.filters)) {
    if (ids.length > 0) params[key] = ids;
  }
  if (query.search.trim()) params['search'] = query.search.trim();
  if (query.sortBy) {
    params['sortBy'] = query.sortBy;
    params['sortOrder'] = query.sortOrder;
  }
  return params;
}

export function toDeclarationDetail({
  isPublic,
  availableToPublic,
  remarks,
  remark,
  ...detail
}: RawDeclarationDetail): DeclarationDetail {
  return {
    ...detail,
    availableToPublic: isPublic ?? availableToPublic ?? false,
    remark: remarks ?? remark ?? '',
  };
}

/** A CSV endpoint that errors can still answer 200 + JSON — reject anything that isn't CSV. */
function assertCsv(response: HttpResponse<Blob>): Observable<Blob> {
  const blob = response.body ?? new Blob();
  const contentType = (response.headers.get('Content-Type') ?? '').toLowerCase();
  if (contentType.includes('csv')) return from([blob]);
  return from(blob.text().catch(() => '')).pipe(
    map((bodyText) => {
      throw new Error(
        `Expected a CSV response, received "${contentType || 'unknown'}"${bodyText ? `: ${bodyText}` : ''}`,
      );
    }),
  );
}

// CONCEPT: HTTP service returning cold Observables | REACT: outcomeDocumentsService (axios promises) + TanStack Query hooks | INTERVIEW: nothing is sent until someone subscribes; the component decides caching/cancellation with RxJS operators.
// OLD: constructor(private http: HttpClient) {}
@Injectable({ providedIn: 'root' })
export class OutcomeDocumentsService {
  private readonly http = inject(HttpClient);

  getBanner(): Observable<OutcomeSummaryResponse> {
    return this.http.get<OutcomeSummaryResponse>(DASHBOARD_ENDPOINTS.banner, {
      params: toHttpParams({ group: 'outcomes' }),
    });
  }

  getCharts(): Observable<OutcomeChartsResponse> {
    return this.http.get<OutcomeChartsResponse>(DASHBOARD_ENDPOINTS.charts, {
      params: toHttpParams({ group: 'outcomes' }),
    });
  }

  /** Monitoring Matrix rows — `workflow=publishedData` scopes the shared endpoint to published records. */
  getFilterData(query: DeclarationQuery): Observable<FilterResponse> {
    return this.http.get<FilterResponse>(DECLARATION_ENDPOINTS.filter, {
      params: toHttpParams({ ...filterQueryParams(query), workflow: 'publishedData' }),
    });
  }

  exportDeclarations(query: DeclarationQuery): Observable<Blob> {
    return this.http
      .get(DECLARATION_ENDPOINTS.filter, {
        params: toHttpParams({
          ...filterQueryParams(query),
          export: 'csv',
          workflow: 'publishedData',
        }),
        responseType: 'blob',
        // The page shows its own "Could not export" toast — skip the global one.
        context: withFlags(SKIP_ERROR_TOAST),
        observe: 'response',
      })
      .pipe(switchMap(assertCsv));
  }

  getDropdownOptions(filter: DropdownFilterKey): Observable<DropdownResponse> {
    return this.http.get<DropdownResponse>(DECLARATION_ENDPOINTS.dropdown, {
      params: toHttpParams({ filter }),
    });
  }

  getDeclarationById(id: number): Observable<DeclarationDetail> {
    return this.http
      .get<RawDeclarationDetail>(DECLARATION_ENDPOINTS.detail(id))
      .pipe(map(toDeclarationDetail));
  }

  exportDeclaration(id: number): Observable<Blob> {
    return this.http
      .get(DECLARATION_ENDPOINTS.detail(id), {
        params: toHttpParams({ export: 'csv' }),
        responseType: 'blob',
        // The page shows its own "Could not export" toast — skip the global one.
        context: withFlags(SKIP_ERROR_TOAST),
        observe: 'response',
      })
      .pipe(switchMap(assertCsv));
  }
}
