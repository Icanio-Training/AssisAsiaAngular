import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable, shareReplay } from 'rxjs';

import { SKIP_GLOBAL_LOADING, withFlags } from '@core/http/http-context';
import { toHttpParams } from '@core/http/api-params';

import { DATA_MANAGEMENT_ENDPOINTS } from '../constants/endpoints';
import type { KpiOption, RawKpiDropdownItem } from '../models/ascc-kpi.models';
import type { StepperGroup, StepperResponse } from '../models/wizard.models';
import type { DropdownOption } from './activities.service';

// Data Management's OWN lookups (React reused hooks from features/initiatives and
// features/outcome-documents; here the feature stays self-contained).

/** `GET dropdowns` subset the Tool 1 form needs. */
export interface InitiativeDropdowns {
  statuses: DropdownOption[];
  activityTypes: DropdownOption[];
  frequencies: DropdownOption[];
  sectoralBodies: DropdownOption[];
}

export interface StrategicMeasureOption {
  id: number;
  code: string;
  name: string;
  description: string;
  objectiveId: number | null;
}

export type DeclarationDropdownKey = 'body' | 'sector' | 'type' | 'level' | 'chair';
export type DeclarationDropdowns = Record<DeclarationDropdownKey, DropdownOption[]>;

interface RawDeclarationOption {
  id: number;
  name: string | number;
}

const DECLARATION_KEYS: readonly DeclarationDropdownKey[] = [
  'body',
  'sector',
  'type',
  'level',
  'chair',
];

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly http = inject(HttpClient);

  readonly initiativeDropdowns$: Observable<InitiativeDropdowns> = this.http
    .get<InitiativeDropdowns>(DATA_MANAGEMENT_ENDPOINTS.dropdowns)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  // CONCEPT: forkJoin | REACT: `Promise.all(FILTER_KEYS.map(getDropdownOptions))` in useDeclarationDropdowns | INTERVIEW: forkJoin subscribes to all inner Observables in PARALLEL and emits once, when every one has completed — ideal for "load N dropdowns, then render".
  readonly declarationDropdowns$: Observable<DeclarationDropdowns> = forkJoin(
    Object.fromEntries(
      DECLARATION_KEYS.map((key) => [
        key,
        this.http
          .get<RawDeclarationOption[]>(DATA_MANAGEMENT_ENDPOINTS.declarations.dropdown, {
            params: toHttpParams({ filter: key }),
          })
          .pipe(map((options) => options.map((o) => ({ id: o.id, name: String(o.name) })))),
      ]),
    ) as Record<DeclarationDropdownKey, Observable<DropdownOption[]>>,
  ).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly kpiOptions$: Observable<KpiOption[]> = this.http
    .get<RawKpiDropdownItem[]>(DATA_MANAGEMENT_ENDPOINTS.asccKpi.options)
    .pipe(
      map((rows) => rows.map(({ id, code, description }) => ({ id, code, title: description }))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  /** Server-side search — callers debounce. */
  searchStrategicMeasures(search: string): Observable<StrategicMeasureOption[]> {
    return this.http.get<StrategicMeasureOption[]>(DATA_MANAGEMENT_ENDPOINTS.strategicMeasures, {
      params: toHttpParams({ search }),
      context: withFlags(SKIP_GLOBAL_LOADING),
    });
  }

  getStepper(group: StepperGroup): Observable<StepperResponse> {
    return this.http.get<StepperResponse>(DATA_MANAGEMENT_ENDPOINTS.stepper, {
      params: toHttpParams({ group }),
      context: withFlags(SKIP_GLOBAL_LOADING),
    });
  }
}
