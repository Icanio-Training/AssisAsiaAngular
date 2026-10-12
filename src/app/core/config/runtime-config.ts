import { HttpBackend, HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';

import { environment } from '@env/environment';

/** All backend REST endpoints are versioned under this path. */
const API_VERSION_PREFIX = '/api/v1';

export interface RuntimeConfig {
  /** Backend origin, e.g. "https://api.adme.example". Empty = same origin (dev proxy / ingress). */
  apiBaseUrl: string;
  /** true = answer API calls from the in-app mock backend (no Laravel needed). */
  useMocks: boolean;
}

// CONCEPT: runtime configuration (config.json) | REACT: import.meta.env (baked in at BUILD time) | INTERVIEW: build the image once, then change the API URL per environment (DEV/UAT/PROD) by mounting a different config.json — e.g. from a Kubernetes ConfigMap — without rebuilding.
// environment.ts still holds build-time defaults; /config.json overrides them at startup.
// Switch to your local Laravel API: set "useMocks": false in public/config.json and reload.
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  // CONCEPT: HttpBackend bypasses ALL interceptors | REACT: a separate axios instance | INTERVIEW: needed here because the interceptors themselves depend on this config (chicken-and-egg).
  private readonly http = new HttpClient(inject(HttpBackend));

  private readonly config = signal<RuntimeConfig>({
    apiBaseUrl: environment.apiBaseUrl,
    useMocks: environment.useMocks,
  });

  readonly useMocks = computed(() => this.config().useMocks);
  readonly apiUrl = computed(
    () => `${this.config().apiBaseUrl.replace(/\/+$/, '')}${API_VERSION_PREFIX}`,
  );

  /** Called once by provideAppInitializer() before the first route loads. */
  load(): Promise<void> {
    return firstValueFrom(
      this.http.get<Partial<RuntimeConfig>>('config.json').pipe(catchError(() => of({}))),
    ).then((loaded) => {
      // Immutable update: build a NEW object so the signal sees a new reference.
      this.config.update((current) => ({ ...current, ...loaded }));
    });
  }
}
