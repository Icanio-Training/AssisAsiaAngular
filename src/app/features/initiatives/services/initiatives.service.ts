import { HttpClient, type HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, from, type Observable, of, shareReplay, switchMap, throwError } from 'rxjs';

import { DASHBOARD_ENDPOINTS } from '@core/constants/dashboard-endpoints';
import { toHttpParams } from '@core/http/api-params';
import { SKIP_GLOBAL_LOADING, withFlags } from '@core/http/http-context';

import { INITIATIVES_ENDPOINTS } from '../constants/initiatives.constants';
import type {
  ActivityDetailResponse,
  ActivityDetailsQueryParams,
  ActivityDetailsResponse,
} from '../models/activity-details.models';
import type {
  InitiativesChartsResponse,
  InitiativesSummaryResponse,
} from '../models/initiatives.models';
import type {
  DropdownsQueryParams,
  DropdownsResponse,
  InitiativesChartsQueryParams,
  StrategicMeasureListItem,
} from '../models/initiatives-filters.models';

/** Throws (as an Observable error) when a "file" endpoint answered with something else,
    e.g. a JSON error page — otherwise we'd save that as Activity_1.pdf. */
function assertBlobType(expected: string, label: string) {
  return (source: Observable<HttpResponse<Blob>>): Observable<Blob> =>
    source.pipe(
      switchMap((response) => {
        const blob = response.body ?? new Blob();
        const contentType = (response.headers.get('Content-Type') ?? blob.type).toLowerCase();
        if (contentType.includes(expected)) return of(blob);
        return from(blob.text()).pipe(
          switchMap((text) =>
            throwError(
              () =>
                new Error(
                  `Expected a ${label} response, received "${contentType || 'unknown'}"${text ? `: ${text}` : ''}`,
                ),
            ),
          ),
        );
      }),
    );
}

// CONCEPT: HTTP service returning Observables | REACT: initiativesService (axios promises) + TanStack Query hooks | INTERVIEW: services only DESCRIBE requests (cold Observables); nothing is sent until a component subscribes (async pipe, toSignal, rxResource).
// OLD: constructor(private http: HttpClient) {}
@Injectable({ providedIn: 'root' })
export class InitiativesService {
  private readonly http = inject(HttpClient);

  /** Hero banner numbers (title, totals, rates). */
  getSummary(): Observable<InitiativesSummaryResponse> {
    return this.http.get<InitiativesSummaryResponse>(DASHBOARD_ENDPOINTS.banner, {
      params: toHttpParams({ group: 'initiatives' }),
    });
  }

  /** Zone 1 + Zone 2 chart data, narrowed by the dashboard filter bar. */
  getCharts(params: InitiativesChartsQueryParams = {}): Observable<InitiativesChartsResponse> {
    return this.http.get<InitiativesChartsResponse>(DASHBOARD_ENDPOINTS.charts, {
      params: toHttpParams({ ...params, group: 'initiatives' }),
    });
  }

  /** `background: true` for typeahead / cascade lookups — no global progress bar. */
  getDropdowns(
    params: DropdownsQueryParams = {},
    background = false,
  ): Observable<DropdownsResponse> {
    return this.http.get<DropdownsResponse>(INITIATIVES_ENDPOINTS.dropdowns, {
      params: toHttpParams({ ...params }),
      ...(background ? { context: withFlags(SKIP_GLOBAL_LOADING) } : {}),
    });
  }

  // CONCEPT: shareReplay cache | REACT: TanStack Query `staleTime: 5 min` on ['initiatives','dropdowns',{}] | INTERVIEW: shareReplay(1) multicasts ONE HTTP call to every subscriber and replays the last value to late subscribers.
  private fullDropdownsCache: Observable<DropdownsResponse> | null = null;

  /** The unfiltered lists (periods, statuses, bodies…) — fetched once, shared by every filter. */
  fullDropdowns(): Observable<DropdownsResponse> {
    this.fullDropdownsCache ??= this.getDropdowns({}).pipe(
      catchError((error: unknown) => {
        this.fullDropdownsCache = null; // don't cache a failure — the next caller retries
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.fullDropdownsCache;
  }

  getStrategicMeasures(search?: string): Observable<StrategicMeasureListItem[]> {
    return this.http.get<StrategicMeasureListItem[]>(INITIATIVES_ENDPOINTS.strategicMeasures, {
      params: toHttpParams({ search }),
      context: withFlags(SKIP_GLOBAL_LOADING),
    });
  }

  /** Activity Monitor rows — always scoped to published records. */
  getActivityDetails(params: ActivityDetailsQueryParams = {}): Observable<ActivityDetailsResponse> {
    return this.http.get<ActivityDetailsResponse>(INITIATIVES_ENDPOINTS.activityDetails, {
      params: toHttpParams({ ...params, workflow: 'publishedData' }),
    });
  }

  exportActivityDetails(params: ActivityDetailsQueryParams = {}): Observable<Blob> {
    return this.http
      .get(INITIATIVES_ENDPOINTS.activityDetails, {
        params: toHttpParams({ ...params, export: 'csv' }),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(assertBlobType('text/csv', 'CSV'));
  }

  getActivityById(id: number): Observable<ActivityDetailResponse> {
    return this.http.get<ActivityDetailResponse>(INITIATIVES_ENDPOINTS.activityById(id));
  }

  /** Server-rendered PDF of one activity. */
  exportActivity(id: number): Observable<Blob> {
    return this.http
      .get(INITIATIVES_ENDPOINTS.activityExport(id), { responseType: 'blob', observe: 'response' })
      .pipe(assertBlobType('application/pdf', 'PDF'));
  }
}
