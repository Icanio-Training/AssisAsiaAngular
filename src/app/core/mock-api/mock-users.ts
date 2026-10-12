import type { UserProfileResponse } from '@core/auth/auth.models';

// CONCEPT: seed / fixture data | REACT: tests/fixtures/* + MSW handlers | INTERVIEW: a mock backend lets the UI be built and demoed before (or without) the real API.
// DEV-ONLY test accounts — one per role, so every role's menus and buttons can be
// demoed. These are fake credentials for the mock backend; they never reach a server.

/** Shared password for every mock account. */
export const MOCK_PASSWORD = 'Adme@2026';

export interface MockUser {
  readonly profile: UserProfileResponse;
  readonly password: string;
}

const SECTORAL_BODY = { id: 1, name: 'ASEAN Labour Ministers Meeting (ALMM)' };

export const MOCK_USERS: readonly MockUser[] = [
  {
    password: MOCK_PASSWORD,
    profile: {
      id: '1',
      name: 'Aisha Rahman',
      email: 'admin@adme.test',
      role: 'admin',
      role_label: 'Admin',
      sectoral_bodies: [],
      ams: [],
      is_active: true,
    },
  },
  {
    password: MOCK_PASSWORD,
    profile: {
      id: '2',
      name: 'Minh Tran',
      email: 'manager@adme.test',
      role: 'content_manager',
      role_label: 'Content Manager',
      sectoral_bodies: [SECTORAL_BODY],
      ams: [],
      is_active: true,
    },
  },
  {
    password: MOCK_PASSWORD,
    profile: {
      id: '3',
      name: 'Siti Nurhaliza',
      email: 'contributor@adme.test',
      role: 'contributor',
      role_label: 'Contributor',
      sectoral_bodies: [SECTORAL_BODY],
      ams: [],
      is_active: true,
    },
  },
  {
    password: MOCK_PASSWORD,
    profile: {
      id: '4',
      name: 'Guest Viewer',
      email: 'guest@adme.test',
      role: 'guest',
      role_label: 'Guest',
      sectoral_bodies: [],
      ams: [],
      is_active: true,
    },
  },
];
