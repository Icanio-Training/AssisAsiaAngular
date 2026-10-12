import type {
  FormArray,
  FormControl,
  FormGroup,
  FormRecord,
  NonNullableFormBuilder,
} from '@angular/forms';

import { MEMBER_STATES, MAX_MIDTERMS } from '../constants/countries';
import type {
  CommentLogEntry,
  KpiDeepAnalysis,
  KpiDeepAnalysisSave,
  KpiDeepAnalysisSaveRequest,
  KpiOption,
  MemberStatePeriodBlock,
  ProgressChart,
} from '../models/ascc-kpi.models';
import {
  axisNumberValidator,
  chartRulesValidator,
  yIntervalValidator,
} from '../validators/ascc-kpi.validators';
import { trimmedRequired } from '../validators/form.validators';

// Tool 3 — ASCC KPI deep analysis. Replaces React's asccKpi.schema.ts + utils/asccKpiMappers.ts.
// Plain value types first (used by mappers/review/tests), then the FormGroup builders.

export interface CellValues {
  value: string;
  source: string;
}

export interface MemberStateRowValues {
  countryCode: string;
  countryName: string;
  /** Keyed by period slot — see `activeSlots()`. */
  cells: Record<string, CellValues>;
}

export interface ChartValues {
  id: number | null;
  chartType: 'line' | 'bar';
  chartTitle: string;
  yAxisType: 'numeric';
  yMin: string;
  yMax: string;
  yInterval: string;
  baselineYear: string;
  midtermYears: string[];
  endtermYear: string;
  identifiedDataSource: string;
  rows: MemberStateRowValues[];
}

export interface AsccKpiValues {
  leadOrCoLeadSb: string;
  dataSourceStatus: string;
  smDescription: string;
  operationalDefinition: string;
  charts: ChartValues[];
  newDocumentRequest: string;
  newAmdComment: string;
}

/** One X-axis column: baseline, each midterm slot, end term. Keyed by slot, not year. */
export interface PeriodSlot {
  key: string;
  label: string;
  year: string;
}

export const BASELINE_SLOT = 'baseline';
export const ENDTERM_SLOT = 'endterm';
export const midtermSlot = (index: number): string => `midterm-${index}`;

/** Every slot key a row can hold — cell controls exist for all of them up front. */
export const ALL_SLOT_KEYS: readonly string[] = [
  BASELINE_SLOT,
  ...Array.from({ length: MAX_MIDTERMS }, (_, i) => midtermSlot(i)),
  ENDTERM_SLOT,
];

type YearFields = Pick<ChartValues, 'baselineYear' | 'midtermYears' | 'endtermYear'>;

/** The slots that currently have a year picked, in X-axis order. */
export function activeSlots({ baselineYear, midtermYears, endtermYear }: YearFields): PeriodSlot[] {
  const numbered = midtermYears.length > 1;
  return [
    { key: BASELINE_SLOT, label: 'Baseline', year: baselineYear },
    ...midtermYears.map((year, i) => ({
      key: midtermSlot(i),
      label: numbered ? `Midterm ${i + 1}` : 'Midterm',
      year,
    })),
    { key: ENDTERM_SLOT, label: 'End Term', year: endtermYear },
  ].filter((slot) => slot.year !== '');
}

function blankRows(): MemberStateRowValues[] {
  return MEMBER_STATES.map((ms) => ({ countryCode: ms.code, countryName: ms.name, cells: {} }));
}

export function createBlankChart(): ChartValues {
  return {
    id: null,
    chartType: 'line',
    chartTitle: '',
    yAxisType: 'numeric',
    yMin: '-99.99',
    yMax: '99.99',
    yInterval: '0.01',
    baselineYear: '',
    midtermYears: [''],
    endtermYear: '',
    identifiedDataSource: '',
    rows: blankRows(),
  };
}

export function blankFormValues(): AsccKpiValues {
  return {
    leadOrCoLeadSb: '',
    dataSourceStatus: '',
    smDescription: '',
    operationalDefinition: '',
    charts: [createBlankChart()],
    newDocumentRequest: '',
    newAmdComment: '',
  };
}

/* ── API → form ─────────────────────────────────────────────────────── */

export function toKpiOption(record: KpiDeepAnalysis, kpiId: number): KpiOption {
  return { id: kpiId, code: record.kpiCode ?? '', title: record.kpiName ?? '' };
}

function toChartValues(chart: ProgressChart): ChartValues {
  const blank = createBlankChart();
  const years = chart.years ?? { baseline: null, midterms: [], endterm: null };
  const data = chart.memberStateData ?? { baseline: null, midterms: [], endterm: null };
  const rows = blank.rows;
  const fill = (key: string, block: MemberStatePeriodBlock | null | undefined): void => {
    for (const apiRow of block?.rows ?? []) {
      const row = rows.find((r) => r.countryCode === apiRow.country_code);
      if (row) {
        row.cells[key] = {
          value: apiRow.value === null ? '' : String(apiRow.value),
          source: apiRow.data_source ?? '',
        };
      }
    }
  };
  fill(BASELINE_SLOT, data.baseline);
  // Matched by year only — a positional fallback could attach a block to the wrong year.
  years.midterms.forEach((year, i) =>
    fill(
      midtermSlot(i),
      data.midterms.find((b) => b.year === year),
    ),
  );
  fill(ENDTERM_SLOT, data.endterm);

  return {
    ...blank,
    id: chart.id ?? null,
    chartType: chart.chartType === 'bar' ? 'bar' : 'line',
    chartTitle: chart.chartTitle ?? '',
    ...(chart.yAxis && {
      yMin: String(chart.yAxis.min),
      yMax: String(chart.yAxis.max),
      yInterval: String(chart.yAxis.interval),
    }),
    baselineYear: years.baseline === null ? '' : String(years.baseline),
    midtermYears: years.midterms.length > 0 ? years.midterms.map(String) : [''],
    endtermYear: years.endterm === null ? '' : String(years.endterm),
    identifiedDataSource: chart.identifiedDataSource ?? '',
    rows,
  };
}

export function toFormValues(record: KpiDeepAnalysis): AsccKpiValues {
  return {
    leadOrCoLeadSb: record.leadOrCoLeadSb ?? '',
    dataSourceStatus: record.dataSourceStatus ?? '',
    smDescription: record.smDescription ?? '',
    operationalDefinition: record.operationalDefinition ?? '',
    charts: record.progress.length > 0 ? record.progress.map(toChartValues) : [createBlankChart()],
    newDocumentRequest: '',
    newAmdComment: '',
  };
}

/* ── form → API ─────────────────────────────────────────────────────── */

/** Numeric value of one cell, or `null` for "No Data Available". */
export function cellNumber(row: MemberStateRowValues, slot: string): number | null {
  const value = row.cells[slot]?.value?.trim() ?? '';
  return value === '' ? null : Number(value);
}

export function cellSource(row: MemberStateRowValues, slot: string): string {
  return row.cells[slot]?.source?.trim() ?? '';
}

/** A chart the user never touched — dropped on save. */
export function isUntouchedChart(chart: ChartValues): boolean {
  return chart.id === null && chart.chartTitle === '' && activeSlots(chart).length === 0;
}

function toPeriodBlock(chart: ChartValues, slot: PeriodSlot): MemberStatePeriodBlock {
  return {
    year: Number(slot.year),
    rows: chart.rows.map((row) => ({
      country_code: row.countryCode,
      country_name: row.countryName,
      // Only the baseline source is editable; other periods inherit it.
      data_source: cellSource(row, slot.key) || cellSource(row, BASELINE_SLOT),
      value: cellNumber(row, slot.key),
    })),
  };
}

function toProgressChart(chart: ChartValues): ProgressChart {
  const slots = activeSlots(chart);
  const blockFor = (key: string): MemberStatePeriodBlock | null => {
    const slot = slots.find((s) => s.key === key);
    return slot ? toPeriodBlock(chart, slot) : null;
  };
  const midterms = slots.filter((s) => s.key !== BASELINE_SLOT && s.key !== ENDTERM_SLOT);

  return {
    ...(chart.id !== null && { id: chart.id }),
    chartType: chart.chartType,
    chartTitle: chart.chartTitle,
    yAxis: {
      type: chart.yAxisType,
      min: Number(chart.yMin),
      max: Number(chart.yMax),
      interval: Number(chart.yInterval),
    },
    years: {
      baseline: chart.baselineYear ? Number(chart.baselineYear) : null,
      midterms: midterms.map((s) => Number(s.year)),
      endterm: chart.endtermYear ? Number(chart.endtermYear) : null,
    },
    identifiedDataSource: chart.identifiedDataSource,
    memberStateData: {
      baseline: blockFor(BASELINE_SLOT),
      midterms: midterms.map((s) => toPeriodBlock(chart, s)),
      endterm: blockFor(ENDTERM_SLOT),
    },
  };
}

function appendEntry(log: readonly CommentLogEntry[], message: string): CommentLogEntry[] {
  const trimmed = message.trim();
  return trimmed ? [...log, { message: trimmed }] : [...log];
}

/** `record` null → POST (new). A loaded record → PUT carrying its `id`. Never inferred. */
export function toSaveRequest(
  values: AsccKpiValues,
  record: KpiDeepAnalysis | null,
  kpiId: number,
): KpiDeepAnalysisSave {
  const body: KpiDeepAnalysisSaveRequest = {
    kpiDetailId: kpiId,
    leadOrCoLeadSb: values.leadOrCoLeadSb.trim(),
    dataSourceStatus: values.dataSourceStatus.trim(),
    smDescription: values.smDescription.trim(),
    operationalDefinition: values.operationalDefinition.trim(),
    progress: values.charts.filter((c) => !isUntouchedChart(c)).map(toProgressChart),
    documentRequests: appendEntry(record?.documentRequests ?? [], values.newDocumentRequest),
    amdComments: appendEntry(record?.amdComments ?? [], values.newAmdComment),
  };
  return record ? { method: 'PUT', body: { ...body, id: record.id } } : { method: 'POST', body };
}

/* ── FormGroup builders ─────────────────────────────────────────────── */

export type CellForm = FormGroup<{ value: FormControl<string>; source: FormControl<string> }>;

// CONCEPT: FormRecord | REACT: zod `z.record(z.string(), cellSchema)` | INTERVIEW: FormRecord is a FormGroup whose keys aren't known at compile time (all values share one control type) — here one cell group per period slot.
export type MemberStateRowForm = FormGroup<{
  countryCode: FormControl<string>;
  countryName: FormControl<string>;
  cells: FormRecord<CellForm>;
}>;

export type ChartForm = FormGroup<{
  id: FormControl<number | null>;
  chartType: FormControl<'line' | 'bar'>;
  chartTitle: FormControl<string>;
  yAxisType: FormControl<'numeric'>;
  yMin: FormControl<string>;
  yMax: FormControl<string>;
  yInterval: FormControl<string>;
  baselineYear: FormControl<string>;
  midtermYears: FormArray<FormControl<string>>;
  endtermYear: FormControl<string>;
  identifiedDataSource: FormControl<string>;
  rows: FormArray<MemberStateRowForm>;
}>;

export type AsccKpiForm = FormGroup<{
  leadOrCoLeadSb: FormControl<string>;
  dataSourceStatus: FormControl<string>;
  smDescription: FormControl<string>;
  operationalDefinition: FormControl<string>;
  charts: FormArray<ChartForm>;
  newDocumentRequest: FormControl<string>;
  newAmdComment: FormControl<string>;
}>;

function buildRow(fb: NonNullableFormBuilder, row: MemberStateRowValues): MemberStateRowForm {
  const cells = fb.record<CellForm>({});
  for (const key of ALL_SLOT_KEYS) {
    const cell = row.cells[key];
    cells.addControl(
      key,
      fb.group({ value: fb.control(cell?.value ?? ''), source: fb.control(cell?.source ?? '') }),
    );
  }
  return fb.group({
    countryCode: fb.control(row.countryCode),
    countryName: fb.control(row.countryName),
    cells,
  });
}

export function buildChartForm(fb: NonNullableFormBuilder, chart: ChartValues): ChartForm {
  return fb.group(
    {
      id: fb.control<number | null>(chart.id),
      chartType: fb.control<'line' | 'bar'>(chart.chartType),
      chartTitle: fb.control(chart.chartTitle),
      yAxisType: fb.control<'numeric'>(chart.yAxisType),
      yMin: fb.control(chart.yMin, axisNumberValidator('Min')),
      yMax: fb.control(chart.yMax, axisNumberValidator('Max')),
      yInterval: fb.control(chart.yInterval, yIntervalValidator),
      baselineYear: fb.control(chart.baselineYear),
      midtermYears: fb.array(chart.midtermYears.map((y) => fb.control(y))),
      endtermYear: fb.control(chart.endtermYear),
      identifiedDataSource: fb.control(chart.identifiedDataSource),
      rows: fb.array(chart.rows.map((row) => buildRow(fb, row))),
    },
    // zod superRefine → one group validator over the whole chart.
    { validators: [chartRulesValidator] },
  );
}

export function buildAsccKpiForm(fb: NonNullableFormBuilder, values: AsccKpiValues): AsccKpiForm {
  return fb.group({
    leadOrCoLeadSb: fb.control(
      values.leadOrCoLeadSb,
      trimmedRequired('Lead or Co-Lead SB is required'),
    ),
    dataSourceStatus: fb.control(
      values.dataSourceStatus,
      trimmedRequired('Data Source Status is required'),
    ),
    smDescription: fb.control(values.smDescription, trimmedRequired('SM Description is required')),
    operationalDefinition: fb.control(
      values.operationalDefinition,
      trimmedRequired('Operational Definition is required'),
    ),
    charts: fb.array(values.charts.map((chart) => buildChartForm(fb, chart))),
    newDocumentRequest: fb.control(values.newDocumentRequest),
    newAmdComment: fb.control(values.newAmdComment),
  });
}

/** Typed snapshot of the form as plain values (cells come back as a full record). */
export function readAsccKpiValues(form: AsccKpiForm): AsccKpiValues {
  const raw = form.getRawValue();
  return {
    ...raw,
    charts: raw.charts.map((chart) => ({
      ...chart,
      rows: chart.rows.map((row) => ({ ...row, cells: { ...row.cells } })),
    })),
  };
}
