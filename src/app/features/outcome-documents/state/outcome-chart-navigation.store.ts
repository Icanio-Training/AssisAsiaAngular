import { Injectable, signal } from '@angular/core';

import type { OutcomeChartId } from '../constants/outcome-documents.constants';

// CONCEPT: tiny signal service for cross-page UI state | REACT: Zustand useOutcomeChartNavigationStore | INTERVIEW: the dashboard writes "which chart was clicked" before navigating; when the dashboard is shown again it reads it once, scrolls there, and clears it.
@Injectable({ providedIn: 'root' })
export class OutcomeChartNavigationStore {
  private readonly _returnChartId = signal<OutcomeChartId | null>(null);
  readonly returnChartId = this._returnChartId.asReadonly();

  setReturnChartId(id: OutcomeChartId): void {
    this._returnChartId.set(id);
  }

  clear(): void {
    this._returnChartId.set(null);
  }
}
