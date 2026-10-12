import { HttpContext, HttpContextToken } from '@angular/common/http';

// CONCEPT: HttpContextToken (per-request flags) | REACT: custom fields added to AxiosRequestConfig (skipAuthRedirect, keepEnvelope) | INTERVIEW: lets one request opt out of a global interceptor without string headers.
// Usage: this.http.post(url, body, { context: new HttpContext().set(SKIP_AUTH_REDIRECT, true) })

/** Don't treat a 401 as "session expired" — e.g. a login attempt, where 401 = wrong password. */
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

/** Return the raw `{ success, message, data }` envelope instead of unwrapping it. */
export const KEEP_ENVELOPE = new HttpContextToken<boolean>(() => false);

/** Don't show the global top progress bar (background polling, typeahead search…). */
export const SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);

/** The caller shows its own error UI — don't pop the global error snackbar. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Internal: set on the retried request after a token refresh (prevents refresh loops). */
export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

/** Convenience: a context with several flags set to true. */
export function withFlags(...tokens: HttpContextToken<boolean>[]): HttpContext {
  return tokens.reduce((ctx, token) => ctx.set(token, true), new HttpContext());
}
