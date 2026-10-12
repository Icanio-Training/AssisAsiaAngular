import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { SKIP_ERROR_TOAST, withFlags } from '@core/http/http-context';

import { DATA_MANAGEMENT_ENDPOINTS } from '../constants/endpoints';
import type { KpiDeepAnalysis, KpiDeepAnalysisSave } from '../models/ascc-kpi.models';

const ENDPOINTS = DATA_MANAGEMENT_ENDPOINTS.asccKpi;

@Injectable({ providedIn: 'root' })
export class AsccKpiService {
  private readonly http = inject(HttpClient);

  /** 404 = nothing published yet — the page shows its own empty state, so no toast. */
  getDeepAnalysis(kpiId: number): Observable<KpiDeepAnalysis> {
    return this.http.get<KpiDeepAnalysis>(ENDPOINTS.deepAnalysis(kpiId), {
      context: withFlags(SKIP_ERROR_TOAST),
    });
  }

  /** POST (new) or PUT (edit, body carries `id`) — chosen explicitly by the caller. */
  save(kpiId: number, save: KpiDeepAnalysisSave): Observable<KpiDeepAnalysis> {
    const url = ENDPOINTS.deepAnalysis(kpiId);
    return save.method === 'POST'
      ? this.http.post<KpiDeepAnalysis>(url, save.body)
      : this.http.put<KpiDeepAnalysis>(url, save.body);
  }
}
