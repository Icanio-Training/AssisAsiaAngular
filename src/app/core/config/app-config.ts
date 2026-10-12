import { environment } from '@env/environment';

// CONCEPT: build-time constants | REACT: config/app.config.ts reading import.meta.env | INTERVIEW: values that never change per deployment live here; values that DO change per environment (API URL, mocks) live in RuntimeConfigService (config.json).
export const APP_CONFIG = {
  name: environment.appTitle,
  isProduction: environment.production,
  oauth: environment.oauth,
} as const;
