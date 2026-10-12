// Ported from the React app: src/constants/dashboardEndpoints.ts
export type DashboardGroup = 'initiatives' | 'outcomes' | 'kpi';

export const DASHBOARD_ENDPOINTS = {
  banner: 'dashboard/banner',
  charts: 'dashboard/charts',
} as const;
