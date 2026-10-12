import { HTTP_INTERCEPTORS } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  type MsalGuardConfiguration,
  MsalInterceptor,
  type MsalInterceptorConfiguration,
  MsalService,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  type IPublicClientApplication,
  InteractionType,
  PublicClientApplication,
} from '@azure/msal-browser';

import { environment } from '@env/environment';

// CONCEPT: OAuth2 / OpenID Connect with Azure AD (Entra ID) via MSAL Angular | REACT: @azure/msal-react | INTERVIEW: the SPA redirects to Microsoft's login page (Authorization Code + PKCE), receives an ID token (who you are — OIDC) and an access token (what you may call — OAuth2); MSAL caches tokens, refreshes them silently, and its interceptor attaches them to API calls.
//
// ADME itself uses Laravel Passport (see auth.service.ts: password grant + PKCE redirect), so this is
// DISABLED by default. To try it with your own Entra ID app registration:
//   1. Azure portal → Entra ID → App registrations → New → platform "Single-page application",
//      redirect URI http://localhost:4200.  (No client secret: SPAs are PUBLIC clients.)
//   2. Fill environment.entraId { enabled: true, clientId, tenantId, apiScope: 'api://<api-app-id>/access_as_user' }.
//   3. In app.config.ts: add `provideEntraIdAuth()` to providers and `withInterceptorsFromDi()` to provideHttpClient.
//   4. Protect routes with `canActivate: [MsalGuard]`.
// SECURITY: clientId / tenantId are public identifiers, not secrets. Never put a client SECRET in a
// front-end bundle — anything shipped to the browser is readable. Per-environment values come from
// config.json / Azure Key Vault → pipeline variables, not from git.
//
// OLD (NgModule): MsalModule.forRoot(new PublicClientApplication({...}), guardConfig, interceptorConfig)

function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.entraId.clientId,
      authority: `https://login.microsoftonline.com/${environment.entraId.tenantId}`,
      redirectUri: '/',
      postLogoutRedirectUri: '/login',
    },
    cache: {
      // sessionStorage: tokens die with the tab (smaller XSS window than localStorage).
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
  });
}

function guardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: ['openid', 'profile', environment.entraId.apiScope] },
    loginFailedRoute: '/login',
  };
}

function interceptorConfigFactory(): MsalInterceptorConfiguration {
  // Which URLs get which token: only our own API — never send tokens to third parties.
  const protectedResourceMap = new Map<string, string[]>([
    ['/api/v1/*', [environment.entraId.apiScope]],
  ]);
  return { interactionType: InteractionType.Redirect, protectedResourceMap };
}

/** All MSAL providers. Not registered by default — see the steps above. */
export function provideEntraIdAuth(): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: guardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: interceptorConfigFactory },
    // MSAL ships a CLASS-based interceptor, registered the old DI way (needs withInterceptorsFromDi()).
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ];
  return makeEnvironmentProviders(providers);
}
