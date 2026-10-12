// Ported from the React app: src/features/data-management/types/asccKpi.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

/** Shapes for Tool 3 (ASCC Strategic Plan KPIs), per the SM KPI API
    Reference (`sm-kpi-api-documentation.html`). The API returns camelCase
    (only the member-state rows and comment logs keep snake_case keys), so
    only the dropdown needs a raw → mapped translation. */

/** `GET /dropdowns/kpi` row, as sent by the API. */
export interface RawKpiDropdownItem {
  id: number;
  code: string;
  description: string;
}

/** One "Choose SM KPI" option. `id` is the `kpi_details` id — it is also
    the `{id}` in `.../kpi/{id}/deep-analysis` and the body's `kpiDetailId`. */
export interface KpiOption {
  id: number;
  code: string;
  title: string;
}

export type ChartType = 'line' | 'bar';

export type YAxisType = 'numeric';

export interface YAxisConfig {
  type: string;
  min: number;
  max: number;
  interval: number;
}

export interface ProgressYears {
  baseline: number | null;
  midterms: number[];
  endterm: number | null;
}

export interface MemberStateRow {
  country_code: string;
  country_name?: string | null;
  data_source?: string | null;
  value: number | null;
}

export interface MemberStatePeriodBlock {
  year: number | null;
  rows: MemberStateRow[];
}

export interface MemberStateData {
  baseline: MemberStatePeriodBlock | null;
  midterms: MemberStatePeriodBlock[];
  endterm: MemberStatePeriodBlock | null;
}

/** One `progress[]` chart. Nullable fields are as the API may return them;
    the form always sends them filled in. */
export interface ProgressChart {
  /** Absent on a chart that hasn't been saved yet — the server assigns it. */
  id?: number;
  chartType: string;
  chartTitle: string | null;
  yAxis: YAxisConfig | null;
  years: ProgressYears | null;
  identifiedDataSource: string | null;
  memberStateData: MemberStateData | null;
}

/** "Document request for AMS" / "AMD Comment" entry. `by` (user id) and
    `at` are set by the server — a new entry is sent as `{ message }` only. */
export interface CommentLogEntry {
  message: string;
  country_code?: string | null;
  by?: string;
  at?: string;
}

export interface DeepAnalysisUser {
  id: string;
  name: string;
  email: string;
}

/** The deep analysis object returned by GET, POST and PUT. */
export interface KpiDeepAnalysis {
  id: number;
  kpiDetailId: number | null;
  kpiCode: string | null;
  kpiName: string | null;
  strategicMeasure: { id: number; code: string; name: string };
  leadOrCoLeadSb: string | null;
  coLead: string | null;
  supportingSbs: string | null;
  dataSourceStatus: string | null;
  smDescription: string | null;
  operationalDefinition: string | null;
  identifiedDataSource: string | null;
  baselineData: string | null;
  target: string | null;
  monitoringYear: number | null;
  monitoringStatus: string | null;
  progress: ProgressChart[];
  documentRequests: CommentLogEntry[];
  amdComments: CommentLogEntry[];
  createdBy: DeepAnalysisUser | null;
  updatedBy: DeepAnalysisUser | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Body of `POST` (Save and Publish) on `.../kpi/{id}/deep-analysis` — the
    API rejects an `id` here (422). */
export interface KpiDeepAnalysisSaveRequest {
  kpiDetailId: number;
  leadOrCoLeadSb: string;
  dataSourceStatus: string;
  smDescription: string;
  operationalDefinition: string;
  progress: ProgressChart[];
  documentRequests: CommentLogEntry[];
  amdComments: CommentLogEntry[];
}

/** Body of `PUT` (edit page) — the POST body plus the required deep analysis `id`. */
export interface KpiDeepAnalysisUpdateRequest extends KpiDeepAnalysisSaveRequest {
  id: number;
}

/** What Save and Publish sends. The method is chosen explicitly (never
    inferred from whether `id` happens to be set), so an edit can't silently
    turn into a POST that creates a duplicate deep analysis. */
export type KpiDeepAnalysisSave =
  | { method: 'POST'; body: KpiDeepAnalysisSaveRequest }
  | { method: 'PUT'; body: KpiDeepAnalysisUpdateRequest };
