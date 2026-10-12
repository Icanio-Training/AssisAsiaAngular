// Ported from the React app: src/features/initiatives/types/initiativesFilters.types.ts
// Plain TypeScript types — framework-agnostic, so they move to Angular unchanged.

export interface InitiativesFilters {
  period: number[];
  activityStatus: number[];
  sectoralBody: number[];
  strategicGoal: number | null;
  objective: number | null;
  strategicMeasure: number | null;
}

export const EMPTY_INITIATIVES_FILTERS: InitiativesFilters = {
  period: [],
  activityStatus: [],
  sectoralBody: [],
  strategicGoal: null,
  objective: null,
  strategicMeasure: null,
};

export interface InitiativesChartsQueryParams {
  period?: number[] | undefined;
  activityStatus?: number[] | undefined;
  sectoralBody?: number[] | undefined;
  strategicGoal?: number | undefined;
  objective?: number | undefined;
  strategicMeasure?: number | undefined;
}

export interface DropdownOption {
  id: number;
  name: string;
}

export interface StrategicGoalDropdownOption {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface ObjectiveDropdownOption {
  id: number;
  code: string;
  name: string;
  description: string;
  strategicGoalId: number | null;
}

export interface StrategicMeasureDropdownOption {
  id: number;
  code: string;
  name: string;
  objectiveId: number | null;
}

export interface StrategicMeasureListItem {
  id: number;
  code: string;
  name: string;
  description: string;
  objectiveId: number | null;
}

export type DropdownSearchField =
  'period' | 'status' | 'sectoralBody' | 'strategicGoal' | 'objective' | 'strategicMeasures';

export interface DropdownsQueryParams {
  strategicGoal?: number | undefined;
  objective?: number | undefined;
  strategicMeasures?: number | undefined;
  searchField?: DropdownSearchField | undefined;
  search?: string | undefined;
}

export interface DropdownsResponse {
  periods: DropdownOption[];
  statuses: DropdownOption[];
  activityTypes: DropdownOption[];
  frequencies: DropdownOption[];
  sectoralBodies: DropdownOption[];
  strategicGoals: StrategicGoalDropdownOption[];
  objectives: ObjectiveDropdownOption[];
  strategicMeasures: StrategicMeasureDropdownOption[];
}
