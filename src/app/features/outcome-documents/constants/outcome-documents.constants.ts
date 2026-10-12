// Ported from the React app: features/outcome-documents/constants/*.ts
import type {
  DeclarationFilters,
  DeclarationQuery,
  DropdownFilterKey,
} from '../models/outcome-documents.models';

/** Relative API paths — the apiUrl interceptor adds `<origin>/api/v1`. Same strings as React. */
export const DECLARATION_ENDPOINTS = {
  dropdown: 'declarations/dropdown',
  filter: 'declarations/filter',
  detail: (id: number) => `declarations/${id}`,
} as const;

/** The 7 dropdown filters fetched in parallel (the order the filter bar renders them). */
export const FILTER_KEYS: readonly DropdownFilterKey[] = [
  'year',
  'country',
  'type',
  'level',
  'body',
  'sector',
  'chair',
];

export interface FilterGroupConfig {
  readonly key: DropdownFilterKey;
  readonly label: string;
  /** Material Symbols icon name (React used inline SVG icons). */
  readonly icon: string;
}

export const FILTER_GROUPS: readonly FilterGroupConfig[] = [
  { key: 'year', label: 'Year', icon: 'calendar_month' },
  { key: 'country', label: 'AMS', icon: 'public' },
  { key: 'type', label: 'Type', icon: 'description' },
  { key: 'level', label: 'Level', icon: 'layers' },
  { key: 'body', label: 'Sectoral Body', icon: 'account_tree' },
  { key: 'sector', label: 'Sector', icon: 'grid_view' },
  { key: 'chair', label: 'Chair', icon: 'flag' },
];

export const EMPTY_FILTERS: DeclarationFilters = {
  year: [],
  country: [],
  type: [],
  level: [],
  body: [],
  sector: [],
  chair: [],
};

/** Query used by the dashboard CTA just to read `totalRecords`. */
export const COUNT_ONLY_QUERY: DeclarationQuery = {
  filters: EMPTY_FILTERS,
  search: '',
  page: 1,
  pageSize: 1,
  sortBy: null,
  sortOrder: 'asc',
};

export const PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export const HERO_FALLBACK_TITLE = 'ASCC Outcome Documents Database';
export const HERO_FALLBACK_DESCRIPTION =
  'Explore Follow-up actions for ASCC Outcome Documents across all 11 ASEAN Member States';

export const HERO_GRADIENT =
  'linear-gradient(215deg, #F6A11E 0%, #E5391F 42%, #9E1C3F 78%, #5A1230 100%)';

export const MATRIX_LABEL = 'Monitoring Matrix of the Follow-up Actions to ASCC Outcome Documents';

/** Stable DOM ids for the dashboard charts (ChartCard renders `<id>-card`). */
export const OUTCOME_CHART_IDS = {
  currentStatusOfFollowUpActionsByCountry: 'ams-bar-ranking-chart',
  followUpActionsAcrossMemberStates: 'ams-member-states-chart',
  followUpActionsAcrossSectors: 'sector-chart',
} as const;

export type OutcomeChartId = (typeof OUTCOME_CHART_IDS)[keyof typeof OUTCOME_CHART_IDS];

/** Sticky header (76px) + breadcrumb bar (44px). */
export const OUTCOME_CHART_SCROLL_OFFSET_PX = 120;

/** Where the admin-only Edit button sends a declaration. */
export const editDeclarationPath = (id: number): string =>
  `/data-management/submitted/follow-up-actions/${id}/edit`;
