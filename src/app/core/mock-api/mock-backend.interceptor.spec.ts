import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import type { LoginResponse, UserProfileResponse } from '@core/auth/auth.models';
import { apiUrlInterceptor, envelopeInterceptor } from '@core/http/interceptors';

import { mockBackendInterceptor } from './mock-backend.interceptor';
import { MOCK_PASSWORD } from './mock-users';

// Runs the real url-prefix + envelope interceptors against the mock backend,
// proving the mock behaves like the Laravel API.
describe('mockBackendInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([apiUrlInterceptor, envelopeInterceptor, mockBackendInterceptor]),
        ),
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  function login(email: string, password: string) {
    return firstValueFrom(http.post<LoginResponse>('/auth/login', { email, password }));
  }

  it('logs in a seeded user and unwraps the response envelope', async () => {
    const res = await login('admin@adme.test', MOCK_PASSWORD);
    expect(res.user.role).toBe('admin');
    expect(res.access_token).toMatch(/^mock-access\.1\./);
  });

  it('rejects a wrong password with 401', async () => {
    const error = await login('admin@adme.test', 'wrong').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
  });

  it('returns /auth/me for a valid token and 401 without one', async () => {
    const { access_token } = await login('contributor@adme.test', MOCK_PASSWORD);
    const me = await firstValueFrom(
      http.get<UserProfileResponse>('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    );
    expect(me.email).toBe('contributor@adme.test');

    const error = await firstValueFrom(http.get('/auth/me')).catch((e: unknown) => e);
    expect((error as HttpErrorResponse).status).toBe(401);
  });

  it('rotates the refresh token (old one becomes invalid)', async () => {
    const { refresh_token } = await login('guest@adme.test', MOCK_PASSWORD);
    const first = await firstValueFrom(
      http.post<LoginResponse>('/auth/refresh', { refresh_token }),
    );
    expect(first.refresh_token).not.toBe(refresh_token);

    const reused = await firstValueFrom(http.post('/auth/refresh', { refresh_token })).catch(
      (e: unknown) => e,
    );
    expect((reused as HttpErrorResponse).status).toBe(401);
  });
});
