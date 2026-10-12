import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, timer } from 'rxjs';

import { RuntimeConfigService } from '@core/config/runtime-config';
import { BLUEPRINT_KPI_MOCK_ROUTES } from '@features/blueprint-kpi/mock/blueprint-kpi.mock';
import { DATA_MANAGEMENT_MOCK_ROUTES } from '@features/data-management/mock/data-management.mock';
import { INITIATIVES_MOCK_ROUTES } from '@features/initiatives/mock/initiatives.mock';
import { OUTCOME_DOCUMENTS_MOCK_ROUTES } from '@features/outcome-documents/mock/outcome-documents.mock';
import { PRACTICE_STUDENTS_MOCK_ROUTES } from '@features/practice-students/mock/practice-students.mock';

import { AUTH_MOCK_ROUTES } from './auth.mock';
import type { MockRoute } from './mock-utils';

// CONCEPT: mock backend via HttpInterceptorFn | REACT: MSW (Mock Service Worker) handlers | INTERVIEW: an interceptor can answer a request itself instead of calling next(req) — the UI can be built and demoed with no backend.
// Registered LAST, so every real interceptor still runs (token, envelope unwrap, refresh, errors).
// Switched on/off at RUNTIME by public/config.json → "useMocks". Unmatched requests fall through
// to the real API (next(req)), so you can mock some endpoints and use Laravel for the rest.

const MOCK_LATENCY_MS = 300;

const ALL_ROUTES: readonly MockRoute[] = [
  ...AUTH_MOCK_ROUTES,
  ...INITIATIVES_MOCK_ROUTES,
  ...OUTCOME_DOCUMENTS_MOCK_ROUTES,
  ...BLUEPRINT_KPI_MOCK_ROUTES,
  ...DATA_MANAGEMENT_MOCK_ROUTES,
  ...PRACTICE_STUDENTS_MOCK_ROUTES,
];

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(RuntimeConfigService);
  if (!config.useMocks()) return next(req);

  const apiUrl = config.apiUrl();
  const path =
    (req.url.startsWith(apiUrl) ? req.url.slice(apiUrl.length) : req.url).split('?')[0] ?? '';

  for (const route of ALL_ROUTES) {
    if (route.method !== req.method) continue;
    const params = path.match(route.path);
    if (params) {
      // timer() + switchMap: simulate latency for successes AND errors (delay() wouldn't delay errors).
      return timer(MOCK_LATENCY_MS).pipe(switchMap(() => route.handle(req, params)));
    }
  }
  return next(req);
};
