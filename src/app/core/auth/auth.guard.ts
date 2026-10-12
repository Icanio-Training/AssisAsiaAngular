import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { POST_LOGIN_ROUTE, ROUTES } from '@core/constants/routes';

import { AuthStore } from './auth.store';

// CONCEPT: functional route guard (canActivate) | REACT: TanStack `beforeLoad` + throw redirect() | INTERVIEW: return true to allow, or a UrlTree to redirect; guards are UX only — the API still enforces access.
// OLD (class-based): @Injectable() class AuthGuard implements CanActivate { canActivate() { ... } }
// Fully covered in M2 (routing) and M6 (security, role-based guards).

/** Only signed-in users may enter the app shell. */
export const authGuard: CanActivateFn = () => {
  const isLoggedIn = inject(AuthStore).isLoggedIn();
  return isLoggedIn || inject(Router).parseUrl(ROUTES.LOGIN);
};

/** Signed-in users skip the login page. */
export const guestOnlyGuard: CanActivateFn = () => {
  const isLoggedIn = inject(AuthStore).isLoggedIn();
  return !isLoggedIn || inject(Router).parseUrl(POST_LOGIN_ROUTE);
};
