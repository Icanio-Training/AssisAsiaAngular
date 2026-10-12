// Ported from the React app: utils/normalizeRoleKey.ts + formatRole.ts + withCreatorRole.ts.
import type { SubmissionCreatedBy } from '../models/submission-creator.models';

const ROLE_KEY_ALIASES: Readonly<Record<string, string>> = {
  administrator: 'admin',
  overall_admin: 'admin',
};

/** `Content Manager` / `CONTENT-MANAGER` / `content_manager` → `content_manager`. */
export function normalizeRoleKey(role: string | null | undefined): string | undefined {
  const key = role
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!key) return undefined;
  return ROLE_KEY_ALIASES[key] ?? key;
}

/** `content_manager` → `Content Manager`. */
export function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const ROLE_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  admin: 'Administrator',
  content_manager: 'Content Manager',
  contributor: 'Contributor',
};

export function roleLabel(role: string): string {
  const key = normalizeRoleKey(role) ?? role;
  return ROLE_DISPLAY_NAMES[key] ?? formatRole(key);
}

/** Folds the detail response's flat `createdByRole` into `createdBy`. */
export function withCreatorRole(
  createdBy: SubmissionCreatedBy | undefined,
  createdByRole: string | null | undefined,
): SubmissionCreatedBy | undefined {
  const role = createdByRole?.trim();
  if (!role) return createdBy;
  if (typeof createdBy === 'string') return { name: createdBy, role };
  return { ...createdBy, role };
}

/** `{ createdBy }` with the role folded in, or `{}` (exactOptionalPropertyTypes-safe spread). */
export function creatorFields(
  createdBy: SubmissionCreatedBy | undefined,
  createdByRole: string | null | undefined,
): { createdBy?: SubmissionCreatedBy } {
  const merged = withCreatorRole(createdBy, createdByRole);
  return merged === undefined ? {} : { createdBy: merged };
}
