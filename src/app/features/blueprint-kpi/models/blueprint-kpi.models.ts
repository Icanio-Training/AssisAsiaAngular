// Ported from the React app: src/features/blueprint-kpi/types/blueprint-kpi.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

/* Field names mirror sm-kpi-api-documentation.html. Types describe the
   unwrapped `data` payload — apiClient strips the { success, message, data }
   envelope. */

/** GET /dashboard/banner?group=kpi */
export interface KpiBanner {
  group: 'kpi';
  title: string;
  description: string;
  /* Hero totals — requested from the backend, not live yet. Optional so the
     hero shows "—" until the API returns them. */
  strategicGoals?: number | null;
  totalStrategicMeasures?: number | null;
  totalKPIs?: number | null;
}

/** GET /strategic-goals — one card */
export interface StrategicGoalSummary {
  id: number;
  code: string;
  label: string;
  title: string;
  description: string;
  objectivesCount: number;
}

export interface StrategicMeasureKpi {
  deepAnalysisId: number | null;
  kpiDetailId: number | null;
  code: string | null;
  description: string | null;
  leadOrCoLeadSb: string | null;
}

export interface StrategicMeasure {
  id: number;
  code: string;
  name: string;
  description: string | null;
  leadSb: string | null;
  kpiCount: number;
  kpis: StrategicMeasureKpi[];
}

export interface StrategicGoalObjective {
  id: number;
  code: string;
  label: string;
  description: string;
  strategicMeasuresCount: number;
  strategicMeasures: StrategicMeasure[];
}

/** GET /strategic-goals/{id} */
export interface StrategicGoalDetail extends StrategicGoalSummary {
  strategicMeasuresCount: number;
  objectives: StrategicGoalObjective[];
}

/* ── SM KPI deep analysis (the "Deep analysis object" in the API doc) ── */

export interface MemberStateRow {
  country_code: string;
  country_name?: string | null;
  data_source?: string | null;
  value: number | null;
}

export interface MemberStatePeriod {
  year: number | null;
  rows: MemberStateRow[];
}

export interface DeepAnalysisChart {
  /** Absent only on a chart that has never been saved. */
  id?: number;
  chartType: string;
  chartTitle: string | null;
  yAxis: { type: string; min: number; max: number; interval: number } | null;
  years: { baseline: number | null; midterms: number[]; endterm: number | null } | null;
  identifiedDataSource: string | null;
  memberStateData: {
    baseline: MemberStatePeriod | null;
    midterms: MemberStatePeriod[];
    endterm: MemberStatePeriod | null;
  } | null;
}

/** documentRequests / amdComments entry. `by` and `at` are set by the server. */
export interface DeepAnalysisLogEntry {
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

/** GET /strategic-measures/kpi/{deepAnalysisId}/deep-analysis */
export interface DeepAnalysis {
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
  progress: DeepAnalysisChart[];
  documentRequests: DeepAnalysisLogEntry[];
  amdComments: DeepAnalysisLogEntry[];
  createdBy: DeepAnalysisUser | null;
  updatedBy: DeepAnalysisUser | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Body of PUT /strategic-measures/kpi/{strategicMeasureId}/deep-analysis.
    The PUT replaces the record: omitted text fields become null and charts
    missing from `progress` are deleted, so callers always send everything. */
export interface DeepAnalysisUpdateRequest {
  id: number;
  kpiDetailId: number | null;
  leadOrCoLeadSb: string | null;
  dataSourceStatus: string | null;
  smDescription: string | null;
  operationalDefinition: string | null;
  identifiedDataSource: string | null;
  progress: DeepAnalysisChart[];
  documentRequests: DeepAnalysisLogEntry[];
  amdComments: DeepAnalysisLogEntry[];
}
