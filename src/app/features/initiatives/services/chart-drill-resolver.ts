import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  forkJoin,
  map,
  type Observable,
  of,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';

import { type ChartDrillState, hasDrillValue } from '../models/chart-drill.models';
import type { DropdownOption } from '../models/initiatives-filters.models';
import {
  bareDrillCode,
  idsForDrillValue,
  objectiveCodeFromMeasureCode,
} from '../utils/drill-resolution';
import { goalIdFromCode } from '../utils/initiatives-utils';
import { InitiativesService } from './initiatives.service';

/** Ids the table request should use. `null` = this dimension isn't drilled (use the manual filter). */
export interface DrillIds {
  period: number[] | null;
  status: number[] | null;
  sectoralBody: number[] | null;
  objective?: number;
  strategicMeasure?: number;
}

export type DrillResolution =
  | { readonly state: 'pending' }
  | { readonly state: 'failed'; readonly network: boolean }
  | { readonly state: 'resolved'; readonly ids: DrillIds };

class DrillNotFoundError extends Error {}

const NO_DRILL: DrillIds = { period: null, status: null, sectoralBody: null };

function idMap(options: readonly DropdownOption[]): Map<string, number> {
  return new Map(options.map((o) => [o.name, o.id]));
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new DrillNotFoundError('Chart drill value has no matching id');
  return value;
}

/**
 * A chart click sends NAMES/CODES ("2021-2025", "SOCA", "OBJECTIVE 1.1", "SM 1.1.1"), but the
 * table endpoint wants numeric ids. This turns a drill into ids using the /dropdowns lookups.
 */
// CONCEPT: composing requests with RxJS (switchMap chains + forkJoin) | REACT: five chained useDropdowns() calls with `enabled:` flags and isPending/isError bookkeeping in ActivityMonitorPage | INTERVIEW: switchMap runs a dependent request after the previous one emits; forkJoin waits for independent ones in parallel; one catchError handles every failure.
@Injectable({ providedIn: 'root' })
export class ChartDrillResolver {
  private readonly api = inject(InitiativesService);

  resolve(drill: ChartDrillState): Observable<DrillResolution> {
    const objectiveCode = drill.objective ? bareDrillCode(drill.objective) : undefined;
    const measureCode = drill.strategicMeasure ? bareDrillCode(drill.strategicMeasure) : undefined;
    const hasNameDrill =
      hasDrillValue(drill.cycle) || hasDrillValue(drill.status) || hasDrillValue(drill.body);

    if (!hasNameDrill && !objectiveCode && !measureCode) {
      return of({ state: 'resolved', ids: NO_DRILL });
    }

    return forkJoin([
      hasNameDrill ? this.resolveNames(drill) : of(NO_DRILL),
      objectiveCode ? this.resolveObjective(objectiveCode) : of(undefined),
      measureCode ? this.resolveMeasure(measureCode) : of(undefined),
    ]).pipe(
      map(([names, objective, strategicMeasure]): DrillResolution => ({
        state: 'resolved',
        ids: {
          ...names,
          ...(objective !== undefined ? { objective } : {}),
          ...(strategicMeasure !== undefined ? { strategicMeasure } : {}),
        },
      })),
      catchError((error: unknown) =>
        of<DrillResolution>({
          state: 'failed',
          network: error instanceof HttpErrorResponse && error.status === 0,
        }),
      ),
      startWith<DrillResolution>({ state: 'pending' }),
    );
  }

  /** Period / status / body names → ids (every requested name must resolve). */
  private resolveNames(drill: ChartDrillState): Observable<DrillIds> {
    return this.api.fullDropdowns().pipe(
      map((dropdowns) => {
        const pick = (value: ChartDrillState['cycle'], options: readonly DropdownOption[]) => {
          if (!hasDrillValue(value)) return null;
          const { ids, requestedCount } = idsForDrillValue(value, idMap(options));
          if (ids.length !== requestedCount) throw new DrillNotFoundError('Unknown drill name');
          return ids;
        };
        return {
          period: pick(drill.cycle, dropdowns.periods),
          status: pick(drill.status, dropdowns.statuses),
          sectoralBody: pick(drill.body, dropdowns.sectoralBodies),
        };
      }),
    );
  }

  /** '1.1' → goal id (via 'SG1') → objective id. */
  private resolveObjective(code: string): Observable<number> {
    return this.goalId(code).pipe(
      switchMap((goalId) => this.api.getDropdowns({ strategicGoal: goalId }, true)),
      map((d) => required(d.objectives.find((o) => o.code === code)?.id)),
    );
  }

  /** '1.1.1' → goal id → objective id ('1.1') → measure id. */
  private resolveMeasure(code: string): Observable<number> {
    const objectiveCode = objectiveCodeFromMeasureCode(code);
    if (!objectiveCode) return throwError(() => new DrillNotFoundError('Bad measure code'));
    return this.goalId(code).pipe(
      switchMap((goalId) =>
        this.api.getDropdowns({ strategicGoal: goalId }, true).pipe(
          map((d) => required(d.objectives.find((o) => o.code === objectiveCode)?.id)),
          switchMap((objectiveId) =>
            this.api.getDropdowns({ strategicGoal: goalId, objective: objectiveId }, true),
          ),
        ),
      ),
      map((d) => required(d.strategicMeasures.find((m) => m.code === code)?.id)),
    );
  }

  private goalId(code: string): Observable<number> {
    const sgCode = goalIdFromCode(code);
    return this.api
      .getDropdowns({ searchField: 'strategicGoal' }, true)
      .pipe(map((d) => required(d.strategicGoals.find((g) => g.code === sgCode)?.id)));
  }
}
