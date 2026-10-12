// Ported from the React app: src/features/blueprint-kpi/constants/endpoints.ts
/* Paths from sm-kpi-api-documentation.html (relative to {BASE_URL}/api/v1 — the
   apiUrl interceptor adds the prefix). The banner uses the shared
   DASHBOARD_ENDPOINTS.banner with group=kpi.
   Watch the ids: the deep-analysis GET takes the DEEP ANALYSIS id, while the
   PUT and the download take the STRATEGIC MEASURE id. */
export const BLUEPRINT_KPI_ENDPOINTS = {
  strategicGoals: 'strategic-goals',
  strategicGoal: (id: number) => `strategic-goals/${id}`,
  deepAnalysis: (id: number) => `strategic-measures/kpi/${id}/deep-analysis`,
  download: (strategicMeasureId: number) => `strategic-measures/kpi/${strategicMeasureId}/download`,
} as const;
