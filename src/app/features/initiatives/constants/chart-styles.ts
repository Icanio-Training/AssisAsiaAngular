// Ported from the React app: features/initiatives/constants/chartStyles.ts (values unchanged).
import type { ActivityStatus } from '../models/initiatives.models';

// Chart 1 — Number of Activities per Period
export const ACTIVITIES_BAR_GRADIENT = { top: '#3B6FD4', bottom: '#2C59A7' } as const;
export const ACTIVITIES_BAR_RADIUS = 6;
export const ACTIVITIES_X_TICK_FONT = { family: 'Inter', size: 12, weight: 600 } as const;
export const ACTIVITIES_X_TICK_COLOR = '#374151';
export const ACTIVITIES_Y_TICK_FONT = { family: 'Inter', size: 11 } as const;
export const ACTIVITIES_Y_TICK_COLOR = '#94A3B8';
export const ACTIVITIES_Y_GRID_COLOR = '#F1F5F9';
export const ACTIVITIES_VALUE_LABEL = {
  color: '#1E3A5F',
  font: 'bold 13px Inter, Arial',
  offsetY: 4,
};

// Chart 2 — Activities Distribution per Work Plan Period (donut)
export const DONUT_CUTOUT = '62%';
export const DONUT_BORDER_COLOR = '#ffffff';
export const DONUT_BORDER_WIDTH = 3;
export const DONUT_HOVER_BORDER_WIDTH = 2.5;
export const DONUT_HOVER_OFFSET = 8;

// Chart 3 — Implementation and Completion Rates Across Monitoring Periods
export const RATES_COMPLETION_COLOR = { fill: 'rgba(199,57,53,0.85)', border: '#C73935' } as const;
export const RATES_IMPLEMENTATION_COLOR = {
  fill: 'rgba(44,89,167,0.85)',
  border: '#2C59A7',
} as const;
export const RATES_BAR_BORDER_WIDTH = 1;
export const RATES_BAR_RADIUS = 3;
export const RATES_TICK_FONT = { family: 'Inter, Arial', size: 11 } as const;
export const RATES_X_TICK_COLOR = '#374151';
export const RATES_Y_GRID_COLOR = 'rgba(0,0,0,0.05)';
export const RATES_Y_STEP_SIZE = 10;
export const RATES_LEGEND_BOX_WIDTH = 12;
export const RATES_VALUE_LABEL = { color: '#374151', font: 'bold 10px Inter, Arial', offsetY: 8 };

// Zone 2 — colours by parent Strategic Goal (SG1..SG12)
export const GOAL_COLORS: Record<string, string> = {
  SG1: '#2C59A7',
  SG2: '#C73935',
  SG3: '#6C3694',
  SG4: '#15803D',
  SG5: '#D99534',
  SG6: '#574DA1',
  SG7: '#639AC0',
  SG8: '#A4C747',
  SG9: '#CF6C31',
  SG10: '#AB138B',
  SG11: '#EBCA39',
  SG12: '#58946E',
};
export const GOAL_COLOR_FALLBACK = '#9CA3AF';

export function goalColor(goalId: string): string {
  return GOAL_COLORS[goalId] ?? GOAL_COLOR_FALLBACK;
}

// Chart 4 / 9 — Objective & Strategic Measure donuts
export const OBJECTIVE_DONUT = {
  cutout: '62%',
  borderColor: '#fff',
  borderWidth: 2,
  hoverOffset: 8,
};
export const SM_DONUT = { cutout: '62%', borderColor: '#fff', borderWidth: 1, hoverOffset: 6 };

// Chart 5 — Distribution of Activities per ASCC Sectoral Body (horizontal bar)
export const BODY_BAR_GRADIENT = { start: '#5B8DD9', end: '#1E3A5F' } as const;
export const BODY_BAR_HOVER_GRADIENT = { start: '#6FA0EA', end: '#15294A' } as const;
export const BODY_BAR_RADIUS = 9;
export const BODY_BAR_PERCENTAGE = 0.56;
export const BODY_CATEGORY_PERCENTAGE = 0.66;
export const BODY_LAYOUT_PADDING = { right: 50, top: 6, bottom: 6 } as const;
export const BODY_TOOLTIP = {
  backgroundColor: '#1E3A5F',
  padding: 12,
  cornerRadius: 10,
  titleFont: { family: 'Inter,Arial', size: 13, weight: 700 },
  bodyFont: { family: 'Inter,Arial', size: 12.5 },
} as const;
export const BODY_X_TICK_FONT = { family: 'Inter,Arial', size: 11 } as const;
export const BODY_X_TICK_COLOR = '#94A3B8';
export const BODY_X_GRID_COLOR = 'rgba(15,23,42,0.05)';
export const BODY_Y_TICK_FONT = { family: 'Inter,Arial', size: 12, weight: 700 } as const;
export const BODY_Y_TICK_COLOR = '#1E293B';
export const BODY_ZEBRA_ROW_COLOR = 'rgba(100,116,139,0.045)';
export const BODY_BAR_SHADOW = { color: 'rgba(30,58,95,0.22)', blur: 10, offsetY: 4 } as const;
export const BODY_VALUE_BADGE = {
  background: '#EEF2F9',
  textColor: '#1E3A5F',
  font: '700 11.5px Inter,Arial',
} as const;

// Chart 6 — Status Activities per Sectoral Bodies (horizontal stacked bar)
export const STATUS_COLORS: Record<ActivityStatus, string> = {
  Completed: '#15803D',
  Ongoing: '#D97706',
  Upcoming: '#2C59A7',
  Withdrawn: '#C73935',
  Removed: '#7C2D12',
};
export const STATUS_ORDER: readonly ActivityStatus[] = [
  'Completed',
  'Ongoing',
  'Upcoming',
  'Withdrawn',
  'Removed',
];
export const BODY_STATUS_BAR_RADIUS = 9;
export const BODY_STATUS_BAR_PERCENTAGE = 0.6;
export const BODY_STATUS_CATEGORY_PERCENTAGE = 0.66;
export const BODY_STATUS_LAYOUT_PADDING = { right: 50, top: 8, bottom: 4 } as const;
export const BODY_STATUS_BAR_SHADOW = {
  color: 'rgba(30,58,95,0.14)',
  blur: 6,
  offsetY: 3,
} as const;

// Chart 7 — Implementation & Completion Rates per Sectoral Body (%)
export const BODY_RATE_IMPLEMENTATION_COLOR = {
  fill: 'rgba(199,57,53,0.80)',
  border: '#C73935',
} as const;
export const BODY_RATE_COMPLETION_COLOR = {
  fill: 'rgba(44,89,167,0.80)',
  border: '#2C59A7',
} as const;

// Chart 8 — Distribution of Activities under each Strategic Goal (stacked bar)
export const GOAL_BAR_FILL_ALPHA_HEX = 'CC';
