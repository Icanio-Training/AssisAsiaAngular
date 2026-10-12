import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { RuntimeConfigService } from '@core/config/runtime-config';
import {
  apiUrlInterceptor,
  authTokenInterceptor,
  envelopeInterceptor,
  errorToastInterceptor,
  loadingInterceptor,
  refreshTokenInterceptor,
  retryGetInterceptor,
} from '@core/http/interceptors';
import { LanguageService } from '@core/i18n/language.service';
import { mockBackendInterceptor } from '@core/mock-api/mock-backend.interceptor';

import { routes } from './app.routes';

// CONCEPT: application providers | REACT: the provider wrappers in main.tsx (<QueryClientProvider>, <RouterProvider>, <Toaster>) | INTERVIEW: everything registered here is injectable app-wide with inject().
// OLD (NgModule era): AppModule { imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes), TranslateModule.forRoot()],
//                                 providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
//                                             { provide: APP_INITIALIZER, useFactory: loadConfig, multi: true }] }
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Runs BEFORE the first navigation: load /config.json, then pick the saved language.
    // CONCEPT: provideAppInitializer | OLD: { provide: APP_INITIALIZER, useFactory, multi: true }
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
    provideAppInitializer(() => inject(LanguageService).init()),

    provideRouter(
      routes,
      withComponentInputBinding(), // route params + query params → component input()s
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Perf: after the first page renders, download the other lazy chunks in the background
      // so the next navigation is instant. (Custom strategies can preload selectively.)
      withPreloading(PreloadAllModules),
    ),

    provideHttpClient(
      withFetch(),
      // Laravel Sanctum/CSRF: read the XSRF-TOKEN cookie, send it back as X-XSRF-TOKEN on
      // mutating same-origin requests. (Bearer-token APIs are CSRF-safe; this matters for cookie auth.)
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      // Requests flow top → bottom; responses come back bottom → top.
      withInterceptors([
        apiUrlInterceptor,
        loadingInterceptor,
        authTokenInterceptor,
        errorToastInterceptor,
        refreshTokenInterceptor,
        retryGetInterceptor,
        envelopeInterceptor,
        mockBackendInterceptor, // last = where the server would be; no-op when useMocks is false
      ]),
    ),

    provideTranslateService({
      fallbackLang: 'en',
      // useHttpBackend: load /i18n/*.json WITHOUT our API interceptors (no /api/v1 prefix, no token).
      loader: provideTranslateHttpLoader({
        prefix: 'i18n/',
        suffix: '.json',
        useHttpBackend: true,
      }),
    }),
  ],
};
