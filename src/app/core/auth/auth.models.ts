// Copied unchanged from features/auth/types/auth.types.ts — plain TypeScript
// interfaces are framework-agnostic, so they port 1:1.

/** Unauthenticated visitors are represented as 'public', never stored on a User. */
export type Role = 'public' | 'guest' | 'contributor' | 'content_manager' | 'admin';

export interface SectoralBody {
  id: number;
  name: string;
}

export interface Ams {
  id: number;
  name: string;
  code?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  sectoralBodies: SectoralBody[];
  ams: Ams[];
  status?: 'active' | 'inactive';
  phoneNumber?: string;
  designation?: string;
  division?: string;
  organization?: string;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  role_label?: string;
  sectoral_bodies: SectoralBody[];
  ams?: Ams[];
  is_active: boolean;
  phone_number?: string;
  designation?: string;
  division?: string;
  organization?: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfileResponse;
}

export function toUser(profile: UserProfileResponse): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    sectoralBodies: profile.sectoral_bodies ?? [],
    ams: profile.ams ?? [],
    status: profile.is_active ? 'active' : 'inactive',
    ...(profile.phone_number !== undefined && { phoneNumber: profile.phone_number }),
    ...(profile.designation !== undefined && { designation: profile.designation }),
    ...(profile.division !== undefined && { division: profile.division }),
    ...(profile.organization !== undefined && { organization: profile.organization }),
  };
}
