// Production values — replaces the React app's `.env.production`.
// Angular has no `import.meta.env`; instead the build swaps this whole file
// for `environment.development.ts` (see `fileReplacements` in angular.json).
export const environment = {
  production: true,
  appTitle: 'ADME Portal',
  apiBaseUrl: '',
  apiTimeoutMs: 30000,
  /** Serve API calls from the in-app mock backend instead of the Laravel API. */
  useMocks: false,
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
    redirectUri: '',
  },
};
