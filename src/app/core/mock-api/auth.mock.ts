import type { LoginRequest, LoginResponse, TokenExchangeResponse } from '@core/auth/auth.models';

import { fail, issueAccessToken, type MockRoute, ok, withUser } from './mock-utils';
import { MOCK_USERS } from './mock-users';

/** Valid refresh tokens → user id. Rotated on every use, like Laravel Passport. */
const refreshTokens = new Map<string, string>();

function issueRefreshToken(userId: string): string {
  const token = `mock-refresh.${userId}.${crypto.randomUUID()}`;
  refreshTokens.set(token, userId);
  return token;
}

export const AUTH_MOCK_ROUTES: MockRoute[] = [
  {
    method: 'POST',
    path: /^\/auth\/login$/,
    handle: (req) => {
      const body = req.body as LoginRequest;
      const user = MOCK_USERS.find(
        (u) => u.profile.email === body.email.trim().toLowerCase() && u.password === body.password,
      );
      if (!user) return fail(req, 401, 'Invalid credentials.');

      const response: LoginResponse = {
        access_token: issueAccessToken(user.profile.id),
        refresh_token: issueRefreshToken(user.profile.id),
        token_type: 'Bearer',
        expires_in: 900,
        user: user.profile,
      };
      return ok(response);
    },
  },
  {
    method: 'POST',
    path: /^\/auth\/refresh$/,
    handle: (req) => {
      const { refresh_token } = req.body as { refresh_token: string };
      const userId = refreshTokens.get(refresh_token);
      if (!userId) return fail(req, 401, 'Refresh token is invalid or expired.');

      refreshTokens.delete(refresh_token); // single-use (rotation)
      const response: TokenExchangeResponse = {
        access_token: issueAccessToken(userId),
        refresh_token: issueRefreshToken(userId),
        token_type: 'Bearer',
        expires_in: 900,
      };
      return ok(response);
    },
  },
  {
    method: 'GET',
    path: /^\/auth\/me$/,
    handle: (req) => withUser(req, (user) => ok(user)),
  },
  {
    method: 'POST',
    path: /^\/auth\/logout$/,
    handle: () => ok(null),
  },
];
