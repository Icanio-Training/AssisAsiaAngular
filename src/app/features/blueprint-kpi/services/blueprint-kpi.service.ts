import { HttpClient, type HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, type Observable, of, shareReplay, tap } from 'rxjs';

import { DASHBOARD_ENDPOINTS, type DashboardGroup } from '@core/constants/dashboard-endpoints';
import { toHttpParams } from '@core/http/api-params';
import { SKIP_ERROR_TOAST, withFlags } from '@core/http/http-context';
import { filenameFromResponse } from '@shared/utils/download';

import { BLUEPRINT_KPI_ENDPOINTS } from '../constants/blueprint-kpi-endpoints';
import type {
  DeepAnalysis,
  DeepAnalysisUpdateRequest,
  KpiBanner,
  StrategicGoalDetail,
  StrategicGoalSummary,
} from '../models/blueprint-kpi.models';

const KPI_GROUP: DashboardGroup = 'kpi';

export interface PdfDownload {
  readonly blob: Blob;
  readonly filename: string;
}

// Ported from the React app: src/features/blueprint-kpi/services/blueprint-kpi.service.ts
// + the caching half of hooks/useBlueprintKpi.ts (TanStack Query's cache).
//
// CONCEPT: @Service() decorator (Angular 22) | REACT: a plain module object + QueryClient | INTERVIEW: a root singleton, auto-provided — the same as @Injectable({ providedIn: 'root' }) with less ceremony.
// OLD: @Injectable({ providedIn: 'root' })
@Service()
export class BlueprintKpiService {
  private readonly http = inject(HttpClient);

  // CONCEPT: shareReplay(1) as a request cache | REACT: useQuery with the same queryKey in several components | INTERVIEW: the first subscriber triggers ONE HTTP call; every later subscriber (hero, explore section, grid) gets the replayed value. On error shareReplay resets, so the next subscriber retries.
  /** GET /dashboard/banner?group=kpi — hero banner copy (hero + explore section). */
  readonly banner$: Observable<KpiBanner> = this.http
    .get<KpiBanner>(DASHBOARD_ENDPOINTS.banner, { params: toHttpParams({ group: KPI_GROUP }) })
    .pipe(shareReplay(1));

  /** GET /strategic-goals — the goal cards (grid) and the hero's goal-count fallback. */
  readonly strategicGoals$: Observable<StrategicGoalSummary[]> = this.http
    .get<StrategicGoalSummary[]>(BLUEPRINT_KPI_ENDPOINTS.strategicGoals)
    .pipe(shareReplay(1));

  private readonly goalCache = new Map<number, Observable<StrategicGoalDetail>>();
  private readonly deepAnalysisCache = new Map<number, Observable<DeepAnalysis>>();

  /** GET /strategic-goals/{id} — {id} is strategic_goals.id. Shared by the page and the breadcrumbs.
      A 404 is NOT retried: retryGetInterceptor only retries network / 5xx errors. */
  getStrategicGoal(id: number): Observable<StrategicGoalDetail> {
    return this.cached(this.goalCache, id, () =>
      this.http.get<StrategicGoalDetail>(BLUEPRINT_KPI_ENDPOINTS.strategicGoal(id)),
    );
  }

  /** GET /strategic-measures/kpi/{id}/deep-analysis — {id} is the DEEP ANALYSIS id
      (`kpis[].deepAnalysisId`). `refresh: true` (the Edit button) skips the cache. */
  getDeepAnalysis(
    deepAnalysisId: number,
    options: { refresh?: boolean } = {},
  ): Observable<DeepAnalysis> {
    if (options.refresh) this.deepAnalysisCache.delete(deepAnalysisId);
    return this.cached(this.deepAnalysisCache, deepAnalysisId, () =>
      this.http.get<DeepAnalysis>(BLUEPRINT_KPI_ENDPOINTS.deepAnalysis(deepAnalysisId)),
    );
  }

  /** PUT /strategic-measures/kpi/{id}/deep-analysis — {id} is the STRATEGIC MEASURE id; the
      body's `id` is the deep analysis being edited. The cache is replaced with the response
      (React: queryClient.setQueryData). */
  updateDeepAnalysis(
    strategicMeasureId: number,
    body: DeepAnalysisUpdateRequest,
  ): Observable<DeepAnalysis> {
    return this.http
      .put<DeepAnalysis>(BLUEPRINT_KPI_ENDPOINTS.deepAnalysis(strategicMeasureId), body, {
        context: withFlags(SKIP_ERROR_TOAST), // the caller shows its own error toast
      })
      .pipe(tap((record) => this.deepAnalysisCache.set(record.id, of(record))));
  }

  /** GET /strategic-measures/kpi/{id}/download — {id} is the STRATEGIC MEASURE id. The backend
      builds the PDF; the filename comes from Content-Disposition. */
  downloadStrategicMeasurePdf(
    strategicMeasureId: number,
    measureCode: string,
  ): Observable<PdfDownload> {
    return this.http
      .get(BLUEPRINT_KPI_ENDPOINTS.download(strategicMeasureId), {
        responseType: 'blob',
        observe: 'response',
        headers: { Accept: 'application/pdf' },
        context: withFlags(SKIP_ERROR_TOAST),
      })
      .pipe(
        map((response: HttpResponse<Blob>) => ({
          blob: response.body ?? new Blob([], { type: 'application/pdf' }),
          filename: filenameFromResponse(response, `sm-${measureCode}-deep-analysis.pdf`),
        })),
      );
  }

  private cached<T>(
    cache: Map<number, Observable<T>>,
    id: number,
    load: () => Observable<T>,
  ): Observable<T> {
    let request = cache.get(id);
    if (!request) {
      request = load().pipe(shareReplay(1));
      cache.set(id, request);
    }
    return request;
  }
}
