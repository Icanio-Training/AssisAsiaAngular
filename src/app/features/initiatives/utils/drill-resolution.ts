// Ported from the React app: the private helpers at the top of ActivityMonitorPage.tsx.
import { type DrillValue, hasDrillValue } from '../models/chart-drill.models';

/** Drilled name(s) → backend ids. `requestedCount` tells "all resolved" from "some missing". */
export function idsForDrillValue(
  value: DrillValue,
  idByName: ReadonlyMap<string, number>,
): { ids: number[]; requestedCount: number } {
  if (value === undefined) return { ids: [], requestedCount: 0 };
  const names = Array.isArray(value) ? value : [value];
  const ids = names
    .map((name) => idByName.get(name))
    .filter((id): id is number => id !== undefined);
  return { ids, requestedCount: names.length };
}

/** A drilled dimension wins over the manual filter panel for that same dimension. */
export function idParamForDrill(
  drillValue: DrillValue,
  drillIds: number[],
  fallback: number[],
): number[] | undefined {
  if (!hasDrillValue(drillValue)) return fallback.length ? fallback : undefined;
  return drillIds.length > 0 ? drillIds : undefined;
}

/** 'OBJECTIVE 1.1' → '1.1', 'SM 1.1.1' → '1.1.1'. */
export function bareDrillCode(code: string): string | undefined {
  return /[\d.]+$/.exec(code)?.[0];
}

/** '1.1.1' → '1.1' (the measure's parent objective). */
export function objectiveCodeFromMeasureCode(measureCode: string): string | undefined {
  const parts = measureCode.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : undefined;
}
