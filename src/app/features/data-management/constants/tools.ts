// Ported from the React app: features/data-management/constants/tools.ts (unchanged data).
import type { Role } from '@core/auth/auth.models';

export interface DataManagementTool {
  readonly id: string;
  /** "Tool 1" / "Tool 2" / "Tool 3" pill shown on the card. */
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  /** Icon/top-bar/tag-pill color. */
  readonly accent: string;
  /** Tag-pill background. */
  readonly accentBg: string;
  readonly roles: readonly Role[];
}

export const SECTORAL_WORK_PLAN_TOOL_ID = 'sectoral-work-plan';
export const FOLLOW_UP_ACTIONS_TOOL_ID = 'follow-up-actions';
/** Tool 3's id — the `:tool` URL segment its routes branch on. */
export const ASCC_KPI_TOOL_ID = 'ascc-kpis';

/** Tool 3 ("ASCC Strategic Plan KPIs") only ever appears for Admin. */
export const DATA_MANAGEMENT_TOOLS: readonly DataManagementTool[] = [
  {
    id: SECTORAL_WORK_PLAN_TOOL_ID,
    tag: 'Tool 1',
    title: 'Sectoral Work Plan',
    description: "Sectoral Bodies' work plan activities.",
    accent: '#2C59A7',
    accentBg: '#E7F1FB',
    roles: ['contributor', 'content_manager', 'admin'],
  },
  {
    id: FOLLOW_UP_ACTIONS_TOOL_ID,
    tag: 'Tool 2',
    title: 'Follow Up Actions',
    description: 'National follow-up actions to declarations.',
    accent: '#58946E',
    accentBg: '#E3F3EB',
    roles: ['contributor', 'content_manager', 'admin'],
  },
  {
    id: ASCC_KPI_TOOL_ID,
    tag: 'Tool 3',
    title: 'ASCC Strategic Plan KPIs',
    description: 'Results framework baseline / mid / end targets.',
    accent: '#C73535',
    accentBg: '#FBE9E7',
    roles: ['admin'],
  },
];

export function getToolById(id: string | undefined): DataManagementTool | undefined {
  return DATA_MANAGEMENT_TOOLS.find((tool) => tool.id === id);
}

export function toolsForRole(role: Role): DataManagementTool[] {
  return DATA_MANAGEMENT_TOOLS.filter((tool) => tool.roles.includes(role));
}
