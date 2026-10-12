// Ported from the React app: src/features/outcome-documents/types/outcome-documents.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

export interface CountryMapEntry {
  code: string;
  name: string;
  followUpActionCount: number;
}

export interface MapResponse {
  countries: CountryMapEntry[];
}

/* ── Drop Down API (GET /dropdown?filter=<key>) ── */

export type DropdownFilterKey = 'country' | 'body' | 'sector' | 'chair' | 'type' | 'level' | 'year';

export interface DropdownOption {
  id: number;
  name: string | number; // year options arrive as numbers
  declarationCount: number;
  code?: string; // present on country options only
}

export type DropdownResponse = DropdownOption[];

export type DeclarationFilters = Record<DropdownFilterKey, number[]>;

/* ── Declaration query — everything the Filter API accepts as query params.
      Filters/search/sort/pagination are all server-side (agreed model);
      the mock simulates the same behavior. ── */

export type DeclarationSortKey =
  'lastUpdateOn' | 'title' | 'type' | 'level' | 'year' | 'chair' | 'sector';

export type SortOrder = 'asc' | 'desc';

export interface DeclarationQuery {
  filters: DeclarationFilters;
  search: string;
  page: number;
  pageSize: number;
  sortBy: DeclarationSortKey | null;
  sortOrder: SortOrder;
}

export interface DeclarationListItem {
  id: number;
  declarationNo: string;
  lastUpdateOn: number;
  title: string;
  sector: string;
  type: string;
  level: string;
  year: number;
  chair: string;
  regionalAseanLevel: number;
  national: number;
  total: number;
}

/** A row of `GET declarations/published` (and the whole body of
    `GET declarations/published/{id}`) — the list row plus publication fields.
    The endpoint takes `page`/`pageSize` only (no filters, search, sort or
    export). */
export interface PublishedDeclaration extends DeclarationListItem {
  status: string | null;
  isPublic: boolean;
  workflowStatus: string;
  approvalStatus: string;
  /* Detail-page fields `declarations/published/{id}` doesn't return yet —
     optional so the public detail page shows them as soon as the backend
     adds them, and "—" until then. */
  fileUrl?: string | null;
  sectoralBodyEntity?: string | null;
  summit?: string | null;
  adoption?: string | null;
  remarks?: string | null;
}

export interface PublishedDeclarationsResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: PublishedDeclaration[];
}

export interface FilterResponse {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  items: DeclarationListItem[];
}

/* ── Declaration detail (GET /declarations/{id}) — confirmed live response
      shape: a superset of the list row, plus per-country action records,
      sectoral bodies, SDGs, and regional-level actions. ── */

export interface DeclarationCountryActions {
  code: string;
  name: string;
  count: number;
  actions: string[];
}

export interface DeclarationSectoralBody {
  name: string;
  sector: string;
}

export interface DeclarationDetail {
  id: number;
  declarationNo: string;
  title: string;
  year: number;
  adoption: string;
  type: string;
  level: string;
  chair: string;
  summit: string;
  sector: string;
  regionalActionsCount: number;
  nationalActionsCount: number;
  hasFollowUpActions: boolean;
  fileUrl: string;
  countries: DeclarationCountryActions[];
  sectoralBodies: DeclarationSectoralBody[];
  sdgs: string[];
  regionalActions: string[];
  position: { current: number; total: number };
  status: string;
  typeofDocument: string;
  availableToPublic: boolean;
  remark: string;
  /** The Tool 2 (Follow Up Action) form's field — `declarations/{id}` returns
      it alongside the older `summit`, which can be stale ("N/A"). The detail
      page prefers it so it shows what was entered in the form. */
  sectoralBodyEntity?: string | null;
}

export type DeclarationDetailResponse = DeclarationDetail;

export interface SectorDistribution {
  sector: string;
  count: number;
  percentage: number;
}

export interface CountryFollowUpItem {
  country: string;
  code: string;
  count: number;
}

export interface OutcomeChartsResponse {
  asOfDate: string;
  currentStatusOfFollowUpActionsByCountry: {
    title: string;
    asOf: string;
    totalDeclarations: number;
    totalInitiatives: number;
    items: CountryFollowUpItem[];
  };
  followUpActionsAcrossMemberStates: {
    title: string;
    asOf: string;
  };
  followUpActionsAcrossSectors: {
    title: string;
    subtitle: string;
    totalDeclarations: number;
    items: SectorDistribution[];
  };
}

export interface OutcomeSummaryResponse {
  group: string;
  title: string;
  description: string;
  followUpCount: number;
  nationalCount: number;
  regionalCount: number;
}
