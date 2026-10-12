// Ported from the React app: src/features/initiatives/types/initiatives.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

export interface InitiativesSummaryResponse {
  title: string;
  description: string;
  totalActivities: number;
  completionRate: number;
  implementationRate: number;
}

export interface PeriodCount {
  period: string;
  count: number;
}

export interface PeriodShare extends PeriodCount {
  percentage: number;
}

export interface PeriodRates {
  period: string;
  completionRate: number;
  implementationRate: number;
  ongoingRate: number;
}

export interface ObjectiveShare {
  code: string;
  count: number;
  percentage: number;
}

export interface SectoralBodyCount {
  code: string;
  count: number;
}

export type ActivityStatus = 'Completed' | 'Ongoing' | 'Upcoming' | 'Withdrawn' | 'Removed';

export interface StatusLegendItem {
  status: ActivityStatus;
  count: number;
}

export interface StatusBreakdown {
  completed: number;
  ongoing: number;
  upcoming: number;
  withdrawn: number;
  removed: number;
}

export interface SectoralBodyStatusItem {
  code: string;
  total: number;
  statuses: StatusBreakdown;
}

export interface SectoralBodyRate {
  code: string;
  implementationRate: number;
  completionRate: number;
  implementationActivity: number;
  completionActivity: number;
}

export interface StrategicGoalCounts {
  SG1: number;
  SG2: number;
  SG3: number;
  SG4: number;
  SG5: number;
  SG6: number;
  SG7: number;
  SG8: number;
  SG9: number;
  SG10: number;
  SG11: number;
  SG12: number;
}

export interface StrategicGoalBodyItem {
  code: string;
  total: number;
  goals: StrategicGoalCounts;
}

/** Zone 1 + Zone 2 chart data — deliberately extensible: later tasks add
    more chart datasets (zone 3+) to this same envelope rather than one
    endpoint per chart, matching the source prototype's own unified
    structure. */
export interface InitiativesChartsResponse {
  asOfDate: string;
  // Zone 1 — Status of Sectoral Work Plans
  activitiesPerPeriod: {
    title: string;
    asOf?: string | undefined;
    summary?: string | undefined;
    items: PeriodCount[];
  };
  activitiesDistributionPerPeriod: {
    title: string;
    asOf?: string | undefined;
    summary?: string | undefined;
    items: PeriodShare[];
  };
  completionAndImplementationRatesPerPeriod: {
    title: string;
    asOf?: string | undefined;
    summary?: string | undefined;
    items: PeriodRates[];
  };
  // Zone 2 — Delivery Performance
  activitiesPerObjective: {
    title: string;
    asOf?: string | undefined;
    items: ObjectiveShare[];
  };
  activitiesPerStrategicMeasure: {
    title: string;
    asOf?: string | undefined;
    items: ObjectiveShare[];
  };
  activitiesPerSectoralBody: {
    title: string;
    asOf?: string | undefined;
    summary?: string | undefined;
    totalActivities: number;
    totalSectoralBodies: number;
    items: SectoralBodyCount[];
  };
  statusActivitiesPerSectoralBody: {
    title: string;
    asOf?: string | undefined;
    summary?: string | undefined;
    legend: StatusLegendItem[];
    items: SectoralBodyStatusItem[];
  };
  implementationAndCompletionRates: {
    title: string;
    asOf?: string | undefined;
    items: SectoralBodyRate[];
  };
  activitiesPerStrategicGoal: {
    title: string;
    asOf?: string | undefined;
    items: StrategicGoalBodyItem[];
  };
}
