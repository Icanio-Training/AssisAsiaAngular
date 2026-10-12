import {
  type HttpEvent,
  HttpErrorResponse,
  HttpHeaders,
  type HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { type Observable, of, throwError } from 'rxjs';

import type { UserProfileResponse } from '@core/auth/auth.models';

import { MOCK_USERS } from './mock-users';

// Shared helpers for every feature's mock routes (features/<name>/mock/<name>.mock.ts).

export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type MockHandler = (
  req: HttpRequest<unknown>,
  /** Regex capture groups from `path`, e.g. /^\/activities\/(\d+)$/ → params[1] = id. */
  params: RegExpMatchArray,
) => Observable<HttpEvent<unknown>>;

export interface MockRoute {
  readonly method: MockMethod;
  /** Matched against the path AFTER the /api/v1 prefix, e.g. /^\/activities\/(\d+)$/. */
  readonly path: RegExp;
  readonly handle: MockHandler;
}

/** 200 + Laravel's success envelope `{ success, message, data }`. */
export function ok<T>(data: T, status = 200): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status, body: { success: true, message: 'OK', data } }));
}

/** A raw (non-enveloped) body — for blobs (CSV/PDF/XLSX downloads) and odd endpoints. */
export function raw(
  body: unknown,
  headers: Record<string, string> = {},
): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 200, body, headers: new HttpHeaders(headers) }));
}

/** An error response shaped like Laravel's: `{ success: false, message, errors? }`. */
export function fail(
  req: HttpRequest<unknown>,
  status: number,
  message: string,
  errors?: Record<string, string[]>,
): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        url: req.url,
        error: { success: false, message, ...(errors ? { errors } : {}) },
      }),
  );
}

/** Reads a query param, supporting the axios-style `key[]` arrays the services send. */
export function queryAll(req: HttpRequest<unknown>, key: string): string[] {
  return req.params.getAll(`${key}[]`) ?? req.params.getAll(key) ?? [];
}

export function query(req: HttpRequest<unknown>, key: string): string | null {
  return req.params.get(key);
}

export interface Paged<T> {
  items: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** Laravel-style pagination over an in-memory array. */
export function paginate<T>(items: readonly T[], page: number, perPage: number): Paged<T> {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    current_page: safePage,
    per_page: perPage,
    total: items.length,
    last_page: Math.max(1, Math.ceil(items.length / perPage)),
  };
}

// ---------------------------------------------------------------------------
// Mock tokens: "mock-access.<userId>.<expiresAtMs>". Short-lived on purpose, so the
// silent-refresh flow (refreshTokenInterceptor) can be seen working in the Network tab.
// ---------------------------------------------------------------------------
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

export function issueAccessToken(userId: string, ttlMs = ACCESS_TOKEN_TTL_MS): string {
  return `mock-access.${userId}.${Date.now() + ttlMs}`;
}

/** The signed-in user for a request, or undefined if the Bearer token is missing/expired. */
export function currentUser(req: HttpRequest<unknown>): UserProfileResponse | undefined {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const [prefix, userId, expiresAt] = token.split('.');
  if (prefix !== 'mock-access' || !userId || Number(expiresAt) < Date.now()) return undefined;
  return MOCK_USERS.find((u) => u.profile.id === userId)?.profile;
}

/** Use inside a handler: `return withUser(req, (user) => ok(...))` → 401 when not signed in. */
export function withUser(
  req: HttpRequest<unknown>,
  handler: (user: UserProfileResponse) => Observable<HttpEvent<unknown>>,
): Observable<HttpEvent<unknown>> {
  const user = currentUser(req);
  return user ? handler(user) : fail(req, 401, 'Unauthenticated.');
}

let nextId = 10_000;
/** Ids for records created in the mock DB during a session. */
export function newId(): number {
  nextId += 1;
  return nextId;
}
