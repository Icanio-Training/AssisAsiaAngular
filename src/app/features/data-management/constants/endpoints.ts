// Ported from the React app: features/data-management/constants/endpoints.ts.
// Paths are relative — apiUrlInterceptor adds the `<origin>/api/v1` prefix.
export const DATA_MANAGEMENT_ENDPOINTS = {
  activities: {
    listDetails: 'activities/details',
    /** React sends the activity workflow-status dropdown to the declarations endpoint too. */
    dropdown: 'declarations/dropdown',
    upload: 'activities/upload',
    draftsOrSubmit: 'activities/draftsOrSubmit',
    template: 'activities/upload/template',
    byId: (id: number | string) => `activities/${id}`,
    approve: (id: number | string) => `activities/${id}/approve`,
    requestRevision: (id: number | string) => `activities/${id}/request-revision`,
    reject: (id: number | string) => `activities/${id}/reject`,
    publish: (id: number | string) => `activities/${id}/publish`,
  },
  declarations: {
    listFilter: 'declarations/filter',
    dropdown: 'declarations/dropdown',
    upload: 'declarations/upload',
    draftsOrSubmit: 'declarations/draftsOrSubmit',
    template: 'declarations/upload/template',
    byId: (id: number | string) => `declarations/${id}`,
    approve: (id: number | string) => `declarations/${id}/approve`,
    requestRevision: (id: number | string) => `declarations/${id}/request-revision`,
    reject: (id: number | string) => `declarations/${id}/reject`,
    publish: (id: number | string) => `declarations/${id}/publish`,
  },
  stepper: 'stepper',
  /** Initiatives' dropdown endpoints (Tool 1 form). */
  dropdowns: 'dropdowns',
  strategicMeasures: 'dropdowns/strategicMeasures',
  asccKpi: {
    options: 'dropdowns/kpi',
    deepAnalysis: (id: number | string) => `strategic-measures/kpi/${id}/deep-analysis`,
  },
} as const;
