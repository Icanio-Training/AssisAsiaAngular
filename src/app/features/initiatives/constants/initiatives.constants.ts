// Ported from the React app: features/initiatives/constants/{endpoints,heroBannerContent,
// initiativeChartIds,activityDetailsStyles}.ts — plain constants, unchanged.

export const INITIATIVES_ENDPOINTS = {
  activityDetails: 'activities/details',
  activityById: (id: number | string) => `activities/${id}`,
  activityExport: (id: number | string) => `activities/${id}/export`,
  dropdowns: 'dropdowns',
  strategicMeasures: 'dropdowns/strategicMeasures',
} as const;

export const HERO_FALLBACK_TITLE = "ASCC Sectoral Bodies' Work Plans";
export const HERO_FALLBACK_DESCRIPTION =
  "Tracking the progress of the ASCC Sectoral Work Plans' implementation.";

export const HERO_GRADIENT =
  'linear-gradient(215deg, #F6A11E 0%, #E5391F 42%, #9E1C3F 78%, #5A1230 100%)';

/** Stable DOM ids for the dashboard charts — PNG filename, `#<id>-card` scroll target. */
export const INITIATIVE_CHART_IDS = {
  activitiesPerPeriod: 'activities-per-period-chart',
  activitiesDistributionPerPeriod: 'donut-chart',
  completionAndImplementationRates: 'impl-completion-chart',
  activitiesPerObjective: 'kra-distribution-chart',
  activitiesPerStrategicMeasure: 'sm-distribution-chart',
  activitiesPerSectoralBody: 'body-distribution-chart',
  statusActivitiesPerSectoralBody: 'body-status-chart',
  implementationAndCompletionRates: 'impl-completion-body-chart',
  activitiesPerStrategicGoal: 'characteristics-distribution-chart',
} as const;

export type InitiativeChartId = (typeof INITIATIVE_CHART_IDS)[keyof typeof INITIATIVE_CHART_IDS];

/** Zone 1 (above the fold) vs Zone 2 (deferred) — decides whether a scroll-restore
    target lives in the @defer block. */
export const ZONE1_CHART_IDS: readonly string[] = [
  INITIATIVE_CHART_IDS.activitiesPerPeriod,
  INITIATIVE_CHART_IDS.activitiesDistributionPerPeriod,
  INITIATIVE_CHART_IDS.completionAndImplementationRates,
];

/** Sticky header (76px) + sticky breadcrumb bar (44px). */
export const CHART_SCROLL_OFFSET_PX = 120;

export const STATUS_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Completed: { bg: '#EBF0FA', color: '#2C59A7' },
  Ongoing: { bg: '#FDF4E3', color: '#D99534' },
  Upcoming: { bg: '#EDE9F9', color: '#6C3694' },
  Withdrawn: { bg: '#FDECEA', color: '#C73935' },
  Removed: { bg: '#F1F5F9', color: '#475569' },
};

export const DEFAULT_STATUS_STYLE = { bg: '#F1F5F9', color: '#475569' };

export function statusStyle(status: string): { bg: string; color: string } {
  return STATUS_BADGE_STYLES[status] ?? DEFAULT_STATUS_STYLE;
}
