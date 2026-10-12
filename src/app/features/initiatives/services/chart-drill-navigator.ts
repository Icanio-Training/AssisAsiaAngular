import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, take } from 'rxjs';

import { ROUTES } from '@core/constants/routes';

import type { ChartDrillSearch } from '../models/chart-drill.models';
import { InitiativesFiltersStore } from '../state/initiatives-filters.store';
import { mergeChartDrillWithFilters, toDrillQueryParams } from '../utils/merge-chart-drill-filters';
import { InitiativesService } from './initiatives.service';

/** Chart bar/slice click → /initiatives/activities?cycle=…&label=… (merged with the dashboard
    filters) and remembers the chart so "Back to Dashboard" can scroll to it. */
// CONCEPT: imperative navigation with query params | REACT: navigate({ to, search }) in useChartDrill / goToActivityMonitor | INTERVIEW: router.navigate([path], { queryParams }) — arrays become repeated keys (?body=A&body=B) and come back as string[] inputs.
@Injectable()
export class ChartDrillNavigator {
  private readonly router = inject(Router);
  private readonly filters = inject(InitiativesFiltersStore);
  private readonly api = inject(InitiativesService);

  drill(chartId: string, search: ChartDrillSearch): void {
    this.filters.setReturnChartId(chartId);
    this.api
      .fullDropdowns() // cached → usually synchronous
      .pipe(
        take(1),
        catchError(() => of(undefined)), // no names to merge → navigate with the click alone
      )
      .subscribe((dropdowns) => {
        const merged = mergeChartDrillWithFilters(search, this.filters.queryParams(), dropdowns);
        void this.router.navigate([ROUTES.INITIATIVES_ACTIVITIES], {
          queryParams: toDrillQueryParams(merged),
        });
      });
  }
}
