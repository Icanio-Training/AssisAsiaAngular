import { inject } from '@angular/core';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';

import { POST_LOGIN_ROUTE } from '@core/constants/routes';

import type { Capability } from './capabilities';
import { RbacService } from './rbac.service';

// CONCEPT: role-based guards (canActivate vs canMatch) | REACT: `beforeLoad: requireCapability('x')` in TanStack routes | INTERVIEW: canMatch runs BEFORE the lazy chunk downloads (a user without access never even fetches the code); canActivate runs after matching.
// Guards are UX only — the API must still reject unauthorized calls (403).
// OLD (class-based): @Injectable() class CapabilityGuard implements CanActivate { canActivate(route) { … route.data.capability … } }

/** Redirect to the landing page when the user lacks `capability`. */
export function capabilityGuard(capability: Capability): CanActivateFn {
  return () => inject(RbacService).can(capability) || inject(Router).parseUrl(POST_LOGIN_ROUTE);
}

/** Skip this route entirely (fall through to the next match / 404) when the user lacks `capability`. */
export function capabilityMatch(capability: Capability): CanMatchFn {
  return () => inject(RbacService).can(capability);
}
