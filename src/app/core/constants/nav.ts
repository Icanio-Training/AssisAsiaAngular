import type { Role } from '@core/auth/auth.models';
import type { Capability } from '@core/rbac/capabilities';

import { ROUTES } from './routes';

// CONCEPT: navigation as typed data | REACT: lib/rbac/navSections.ts (DATABASE_MEGA_MENU, DATA_MANAGEMENT_MENUS) | INTERVIEW: the header loops over this config with @for and filters by capability/role — no hard-coded menus in templates.

export interface NavLink {
  readonly label: string;
  /** Translation key (ngx-translate) for the label. */
  readonly i18nKey: string;
  readonly path: string;
  /** Hidden unless the user has this capability. */
  readonly capability?: Capability;
}

export interface NavSection {
  readonly i18nKey: string;
  readonly links: readonly NavLink[];
}

/** "Database" menu — the three tools in scope (Socio-Cultural Data is out of scope). */
export const DATABASE_LINKS: readonly NavLink[] = [
  {
    label: 'ASCC Initiatives',
    i18nKey: 'nav.initiatives',
    path: ROUTES.INITIATIVES,
    capability: 'initiatives:view',
  },
  {
    label: 'ASCC Outcome Documents',
    i18nKey: 'nav.outcomes',
    path: ROUTES.OUTCOME_DOCUMENTS,
    capability: 'outcome-documents:view',
  },
  {
    label: 'ASCC Strategic Plan KPIs',
    i18nKey: 'nav.kpis',
    path: ROUTES.BLUEPRINT_KPI,
    capability: 'blueprint-kpi:view',
  },
];

const DM = ROUTES.DATA_MANAGEMENT;

const UPLOAD: NavSection = {
  i18nKey: 'nav.addData',
  links: [{ label: 'Upload Data', i18nKey: 'nav.uploadData', path: DM }],
};

const MY_DATA: NavSection = {
  i18nKey: 'nav.myData',
  links: [
    { label: 'Sectoral Work Plan', i18nKey: 'nav.swp', path: `${DM}/my-data/sectoral-work-plan` },
    { label: 'Follow Up Action', i18nKey: 'nav.fua', path: `${DM}/my-data/follow-up-actions` },
  ],
};

const SUBMITTED: NavSection = {
  i18nKey: 'nav.submittedData',
  links: [
    { label: 'Sectoral Work Plan', i18nKey: 'nav.swp', path: `${DM}/submitted/sectoral-work-plan` },
    { label: 'Follow Up Action', i18nKey: 'nav.fua', path: `${DM}/submitted/follow-up-actions` },
  ],
};

const RECORDS: NavSection = {
  i18nKey: 'nav.records',
  links: [{ label: 'Trash Bin', i18nKey: 'nav.trash', path: `${DM}/trash` }],
};

/** "Data Management" menu per role (same as React DATA_MANAGEMENT_MENUS). Guests get none. */
export const DATA_MANAGEMENT_MENUS: Partial<Record<Role, readonly NavSection[]>> = {
  contributor: [UPLOAD, MY_DATA],
  content_manager: [UPLOAD, MY_DATA, SUBMITTED],
  admin: [UPLOAD, MY_DATA, SUBMITTED, RECORDS],
};
