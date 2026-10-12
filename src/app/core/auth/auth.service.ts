import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, type Observable, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { APP_CONFIG } from '@core/config/app-config';
import { POST_LOGIN_ROUTE, ROUTES } from '@core/constants/routes';
import { SKIP_AUTH_REDIRECT, SKIP_ERROR_TOAST, withFlags } from '@core/http/http-context';

import {
  type LoginRequest,
  type LoginResponse,
  type TokenExchangeResponse,
  toUser,
  type User,
  type UserProfileResponse,
} from './auth.models';
import { AuthStore } from './auth.store';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';

const PKCE_VERIFIER_KEY = 'pkce_verifier';
const PKCE_STATE_KEY = 'pkce_state';

// CONCEPT: service orchestrating API + state + navigation | REACT: authService object + useLogin / useLogout / useAuthCallback hooks | INTERVIEW: in React that logic lived in hooks; in Angular it lives in an injectable class and components just call it.
// OLD (constructor injection): constructor(private http: HttpClient, private store: AuthStore, private router: Router) {}
//
// Every HTTP method returns a COLD Observable: nothing is sent until someone subscribes
// (axios fires the request the moment you call it).
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  /** The in-flight refresh, shared by every request that hit a 401 at the same time. */
  private refresh$: Observable<string> | null = null;

  /** Email/password login. Stores the tokens + user, then goes to Initiatives (Database → Tool 1). */
  login(data: LoginRequest): Observable<User> {
    return this.http
      .post<LoginResponse>('/auth/login', data, {
        // 401 here means "wrong password", not "session expired" → let the form show it.
        context: withFlags(SKIP_AUTH_REDIRECT, SKIP_ERROR_TOAST),
      })
      .pipe(
        map((res) => {
          const user = toUser(res.user);
          this.store.setSession(
            { accessToken: res.access_token, refreshToken: res.refresh_token },
            user,
          );
          return user;
        }),
        tap(() => void this.router.navigateByUrl(POST_LOGIN_ROUTE)),
      );
  }

  me(): Observable<User> {
    return this.http.get<UserProfileResponse>('/auth/me').pipe(map(toUser));
  }

  /** Revokes the token server-side, then ALWAYS clears local state — `finalize` runs on success and error. */
  logout(): void {
    this.http
      .post<void>('/auth/logout', {}, { context: withFlags(SKIP_AUTH_REDIRECT, SKIP_ERROR_TOAST) })
      .pipe(finalize(() => this.endSession()))
      .subscribe({ error: () => undefined });
  }

  /** Clear local auth state and go to the login page (also used when a refresh fails). */
  endSession(): void {
    this.store.clear();
    void this.router.navigateByUrl(ROUTES.LOGIN);
  }

  canRefresh(): boolean {
    return this.store.refreshToken() !== null;
  }

  /**
   * CONCEPT: shareReplay to dedupe concurrent work | REACT: the module-level `refreshPromise ??= …` in lib/axios.ts | INTERVIEW: five requests 401 at once → ONE POST /auth/refresh; all five wait on the same shared Observable, then retry.
   */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    this.refresh$ ??= this.http
      .post<TokenExchangeResponse>(
        '/auth/refresh',
        { refresh_token: refreshToken },
        { context: withFlags(SKIP_AUTH_REDIRECT, SKIP_ERROR_TOAST) },
      )
      .pipe(
        // Passport ROTATES the refresh token on every use — store the new one too.
        tap((tokens) =>
          this.store.setSession({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          }),
        ),
        map((tokens) => tokens.access_token),
        finalize(() => (this.refresh$ = null)), // next expiry starts a fresh refresh
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refresh$;
  }

  /** SSO: redirect the browser to the Passport authorize screen (OAuth2 Authorization Code + PKCE). */
  async redirectToAuthorize(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(PKCE_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: APP_CONFIG.oauth.clientId,
      redirect_uri: APP_CONFIG.oauth.redirectUri,
      response_type: 'code',
      scope: '',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    window.location.href = `${APP_CONFIG.oauth.authorizeUrl}?${params.toString()}`;
  }

  /** The /callback step: validate `state` (CSRF), exchange the code, then load the profile.
      Two dependent requests chained with switchMap — the RxJS version of two sequential awaits. */
  completeAuthorization(code: string, state: string | null): Observable<User> {
    const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    const expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_STATE_KEY);

    if (!codeVerifier || !state || state !== expectedState) {
      return throwError(() => new Error('Invalid or missing PKCE session state.'));
    }

    return this.http
      .post<TokenExchangeResponse>(APP_CONFIG.oauth.tokenUrl, {
        grant_type: 'authorization_code',
        client_id: APP_CONFIG.oauth.clientId,
        redirect_uri: APP_CONFIG.oauth.redirectUri,
        code_verifier: codeVerifier,
        code,
      })
      .pipe(
        tap((tokens) =>
          this.store.setSession({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          }),
        ),
        switchMap(() => this.me()),
        tap((user) => {
          this.store.setUser(user);
          void this.router.navigateByUrl(POST_LOGIN_ROUTE);
        }),
      );
  }
}
