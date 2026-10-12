import { HttpErrorResponse, type HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, map, retry, switchMap, throwError, timeout, timer } from 'rxjs';

import { AuthService } from '@core/auth/auth.service';
import { AuthStore } from '@core/auth/auth.store';
import { environment } from '@env/environment';
import { RuntimeConfigService } from '@core/config/runtime-config';
import { NotificationService } from '@core/notify/notification.service';

import {
  KEEP_ENVELOPE,
  RETRIED_AFTER_REFRESH,
  SKIP_AUTH_REDIRECT,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADING,
} from './http-context';
import { LoadingService } from './loading.service';

// CONCEPT: functional HTTP interceptors | REACT: axios.create() + apiClient.interceptors.request/response.use (src/lib/axios.ts) | INTERVIEW: each interceptor does ONE job; they're chained in app.config.ts. Requests flow top→bottom, responses bottom→top.
// OLD (class-based): @Injectable() class AuthInterceptor implements HttpInterceptor { intercept(req, next: HttpHandler) { return next.handle(req) } }
//   + providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }]
//
// Order registered in app.config.ts:
//   apiUrl → loading → authToken → errorToast → refreshToken → retryGet → envelope → (mockBackend)

/** 1. axios `baseURL` + `timeout`: relative URLs get the API origin + /api/v1. */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^https?:\/\//i.test(req.url)) return next(req);
  const apiUrl = inject(RuntimeConfigService).apiUrl();
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${apiUrl}${path}` })).pipe(timeout(environment.apiTimeoutMs));
};

/** 2. Global loading bar: counts requests in flight. `finalize` runs on success, error AND cancel. */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_GLOBAL_LOADING)) return next(req);
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};

/** 3. Attach `Authorization: Bearer <token>` (React: request interceptor reading the Zustand store). */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).accessToken();
  if (!token || req.headers.has('Authorization')) return next(req);
  // HttpRequest is IMMUTABLE — clone() returns a modified copy.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/** 4. One place for "something went wrong" messages. 401 is handled by the refresh interceptor. */
export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.context.get(SKIP_ERROR_TOAST)) {
        const message = toastMessage(error);
        if (message) notify.error(message);
      }
      return throwError(() => error);
    }),
  );
};

function toastMessage(error: HttpErrorResponse): string | null {
  // 401 = "who are you?" (not logged in / token expired) — the refresh interceptor handles it.
  // 403 = "I know who you are, but you're not allowed" — show it.
  if (error.status === 401) return null;
  if (error.status === 403) return "You don't have permission to do that.";
  if (error.status === 0) return 'Network error — please check your connection.';
  if (error.status >= 500) return 'The server had a problem. Please try again.';
  return null; // 4xx validation errors are shown next to the form by the caller
}

/**
 * 5. Silent token refresh (React: the 401 response interceptor + deduped `refreshPromise`).
 * On a 401: refresh the access token ONCE (concurrent 401s share the same refresh via
 * shareReplay inside AuthService.refreshAccessToken), then retry the original request.
 * If refreshing isn't possible or fails → log out.
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: unknown) => {
      const is401 = error instanceof HttpErrorResponse && error.status === 401;
      if (!is401 || req.context.get(SKIP_AUTH_REDIRECT)) return throwError(() => error);

      if (req.context.get(RETRIED_AFTER_REFRESH) || !auth.canRefresh()) {
        auth.endSession();
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        // switchMap: when the refresh emits the new token, switch to retrying the request.
        switchMap((token) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
              context: req.context.set(RETRIED_AFTER_REFRESH, true),
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.endSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

/**
 * 6. Retry GET once on network / 5xx errors (React: TanStack Query `retry: 1`).
 * Only GET: it is IDEMPOTENT (repeating it changes nothing). Retrying a POST could create a duplicate record.
 */
export const retryGetInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 1,
      delay: (error: unknown) =>
        error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)
          ? timer(500)
          : throwError(() => error),
    }),
  );
};

interface EnvelopedResponse {
  success?: boolean;
  status?: string;
  data: unknown;
}

function isEnveloped(payload: unknown): payload is EnvelopedResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    ('success' in payload || 'status' in payload)
  );
}

/** 7. Unwrap Laravel's `{ success, message, data }` so services type against the payload itself. */
export const envelopeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(KEEP_ENVELOPE)) return next(req);
  return next(req).pipe(
    map((event) =>
      event instanceof HttpResponse && isEnveloped(event.body)
        ? event.clone({ body: event.body.data })
        : event,
    ),
  );
};
