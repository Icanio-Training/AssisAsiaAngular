// Used by `ng serve` — replaces the React app's `.env.local`.
// `apiBaseUrl` is empty on purpose: requests go to `/api/v1/...` on the dev
// server, and proxy.conf.json forwards them to the Laravel backend on :8000
// (same job as the `server.proxy` block in the React vite.config.ts).
export const environment = {
  production: false,
  appTitle: 'ADME Portal (dev)',
  apiBaseUrl: '',
  apiTimeoutMs: 30000,
  /** true = no backend needed (see core/mock-api). Set false to use Laravel on :8000. */
  useMocks: true,
  /** Azure AD / Entra ID SSO (MSAL). Disabled: ADME uses Laravel Passport. IDs are public, NOT secrets. */
  entraId: {
    enabled: false,
    clientId: '',
    tenantId: '',
    apiScope: '',
  },
  oauth: {
    clientId: '',
    authorizeUrl: '/api/v1/oauth/authorize',
    tokenUrl: '/oauth/token',
    redirectUri: 'http://localhost:4200/callback',
  },
};
