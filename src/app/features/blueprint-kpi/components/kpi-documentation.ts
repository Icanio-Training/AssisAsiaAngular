import { Component, computed, input, model } from '@angular/core';

import { hasValue } from '../constants/strategic-goal-cards';
import type { DeepAnalysis } from '../models/blueprint-kpi.models';
import type { Draft, EditableTextField, LogField, NewEntries } from '../utils/deep-analysis';
import {
  BaselineTable,
  baselineRows,
  DocPanel,
  EditableText,
  FormattedText,
  LogEntries,
} from './kpi-doc-parts';
import { KpiProgressChart } from './kpi-progress-chart';

// Ported from React: components/KpiDocumentation.tsx
@Component({
  selector: 'app-kpi-documentation',
  imports: [BaselineTable, DocPanel, EditableText, FormattedText, KpiProgressChart, LogEntries],
  template: `
    <div class="flex flex-col gap-3">
      <app-doc-panel title="SM Description" [defaultOpen]="true">
        <app-editable-text
          label="SM Description"
          [value]="record().smDescription"
          [isEditing]="isEditing()"
          [draftValue]="draft().smDescription"
          (draftValueChange)="setDraft('smDescription', $event)"
          hint="Saved on the Strategic Measure, so it changes for every SM KPI under it."
        />
      </app-doc-panel>

      <app-doc-panel title="Operational Definition">
        <app-editable-text
          label="Operational Definition"
          [value]="record().operationalDefinition"
          [isEditing]="isEditing()"
          [draftValue]="draft().operationalDefinition"
          (draftValueChange)="setDraft('operationalDefinition', $event)"
        />
      </app-doc-panel>

      <app-doc-panel title="Progress">
        @if (chartsWithData().length === 0) {
          <p class="text-[13px] text-[#94A0B8] italic">No Data Available</p>
        } @else {
          <div class="flex flex-col gap-8">
            @for (chart of chartsWithData(); track chart.id ?? $index) {
              <app-kpi-progress-chart [chart]="chart" />
            }
          </div>
        }
      </app-doc-panel>

      <app-doc-panel title="Identified Data Source">
        <app-editable-text
          label="Identified Data Source"
          [value]="record().identifiedDataSource"
          [isEditing]="isEditing()"
          [draftValue]="draft().identifiedDataSource"
          (draftValueChange)="setDraft('identifiedDataSource', $event)"
        />
        @for (chart of chartSources(); track chart.id ?? $index) {
          <p class="mt-[9px]">
            <span class="font-bold">{{ chart.chartTitle ?? 'Chart' }}:</span>
            {{ chart.identifiedDataSource }}
          </p>
        }
      </app-doc-panel>

      <app-doc-panel title="Baseline Data by Member State">
        @if (baselineCharts().length > 0) {
          <div class="flex flex-col gap-5">
            @for (chart of baselineCharts(); track chart.id ?? $index) {
              <app-baseline-table [chart]="chart" [showTitle]="baselineCharts().length > 1" />
            }
          </div>
        } @else if (baselineText(); as text) {
          <app-formatted-text [text]="text" />
        } @else {
          <p class="text-[13px] text-[#94A0B8] italic">No Data Available</p>
        }
      </app-doc-panel>

      <app-doc-panel title="Document request for AMS">
        <app-log-entries
          label="Document request for AMS"
          [entries]="record().documentRequests"
          [isEditing]="isEditing()"
          [newEntry]="newEntries().documentRequests"
          (newEntryChange)="setNewEntry('documentRequests', $event)"
        />
      </app-doc-panel>

      <app-doc-panel title="AMD Comment">
        <app-log-entries
          label="AMD Comment"
          [entries]="record().amdComments"
          [isEditing]="isEditing()"
          [newEntry]="newEntries().amdComments"
          (newEntryChange)="setNewEntry('amdComments', $event)"
        />
      </app-doc-panel>
    </div>
  `,
})
export class KpiDocumentation {
  readonly record = input.required<DeepAnalysis>();
  readonly isEditing = input(false);

  // CONCEPT: model() — two-way binding | REACT: a value prop + an onChange callback prop (draft / onDraftChange) | INTERVIEW: model() is an input AND an output in one; the parent writes [(draft)]="draft" and the child calls draft.set()/update() — the parent's signal changes directly. input()+output() is one-way down + an event up, which the parent must handle itself (see EditableText's draftValue / draftValueChange).
  // OLD: @Input() draft!: Draft; @Output() draftChange = new EventEmitter<Draft>();
  readonly draft = model.required<Draft>();
  readonly newEntries = model.required<NewEntries>();

  protected readonly chartsWithData = computed(() =>
    this.record().progress.filter((chart) => chart.memberStateData !== null),
  );
  /** Chart-level data sources that add something beyond the KPI-level one. */
  protected readonly chartSources = computed(() =>
    this.record().progress.filter(
      (chart) =>
        hasValue(chart.identifiedDataSource) &&
        chart.identifiedDataSource !== this.record().identifiedDataSource,
    ),
  );
  protected readonly baselineCharts = computed(() =>
    this.record().progress.filter((chart) => baselineRows(chart).length > 0),
  );
  protected readonly baselineText = computed(() => {
    const text = this.record().baselineData;
    return hasValue(text) ? text : null;
  });

  protected setDraft(field: EditableTextField, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  protected setNewEntry(field: LogField, value: string): void {
    this.newEntries.update((entries) => ({ ...entries, [field]: value }));
  }
}
