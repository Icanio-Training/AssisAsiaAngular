// Ported from the React app: src/features/blueprint-kpi/utils/deepAnalysis.ts (+ FormattedText's
// parsing, moved out of the component so it is a pure, testable function).
import type {
  DeepAnalysis,
  DeepAnalysisChart,
  DeepAnalysisUpdateRequest,
  MemberStatePeriod,
} from '../models/blueprint-kpi.models';

/* ── Edit / Save ── */

export type MetaField = 'leadOrCoLeadSb' | 'dataSourceStatus';
export type EditableTextField = 'smDescription' | 'operationalDefinition' | 'identifiedDataSource';
export type LogField = 'documentRequests' | 'amdComments';
export type Draft = Record<MetaField | EditableTextField, string>;
export type NewEntries = Record<LogField, string>;

export const META_FIELDS: readonly { field: MetaField; label: string }[] = [
  { field: 'leadOrCoLeadSb', label: 'Lead or Co-Lead SB' },
  { field: 'dataSourceStatus', label: 'Data Source Status (Deep Analysis)' },
];

export const EMPTY_ENTRIES: NewEntries = { documentRequests: '', amdComments: '' };

export const EMPTY_DRAFT: Draft = {
  leadOrCoLeadSb: '',
  dataSourceStatus: '',
  smDescription: '',
  operationalDefinition: '',
  identifiedDataSource: '',
};

export function draftFrom(record: DeepAnalysis): Draft {
  return {
    leadOrCoLeadSb: record.leadOrCoLeadSb ?? '',
    dataSourceStatus: record.dataSourceStatus ?? '',
    smDescription: record.smDescription ?? '',
    operationalDefinition: record.operationalDefinition ?? '',
    identifiedDataSource: record.identifiedDataSource ?? '',
  };
}

const orNull = (value: string) => (value.trim() === '' ? null : value);

/** The PUT replaces the whole record, so everything not edited here —
    charts (with their ids) and existing log entries — is sent back as-is. */
export function buildUpdateBody(
  record: DeepAnalysis,
  draft: Draft,
  newEntries: NewEntries,
): DeepAnalysisUpdateRequest {
  const withNew = (field: LogField) =>
    newEntries[field].trim() === ''
      ? record[field]
      : [...record[field], { message: newEntries[field].trim() }];
  return {
    id: record.id,
    kpiDetailId: record.kpiDetailId,
    leadOrCoLeadSb: orNull(draft.leadOrCoLeadSb),
    dataSourceStatus: orNull(draft.dataSourceStatus),
    smDescription: orNull(draft.smDescription),
    operationalDefinition: orNull(draft.operationalDefinition),
    identifiedDataSource: orNull(draft.identifiedDataSource),
    progress: record.progress,
    documentRequests: withNew('documentRequests'),
    amdComments: withNew('amdComments'),
  };
}

/* ── Formatted text (paragraphs + bullet lists, rendered by the template — no innerHTML) ── */

export type TextBlock =
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'ul'; readonly items: readonly string[] };

const BULLET = /^\s*(?:[-•]|\d+[.)])\s+/;

/** Paragraphs, with "- / • / 1." lines promoted to a bullet list (presentation only). */
export function formatBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length > 0) blocks.push({ kind: 'ul', items: bullets });
    bullets = [];
  };
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (BULLET.test(line)) {
      bullets.push(line.replace(BULLET, ''));
    } else {
      flush();
      blocks.push({ kind: 'p', text: line });
    }
  }
  flush();
  return blocks;
}

/* ── Progress chart ── */

/* One colour per member state, in API row order. */
const SERIES_COLORS = [
  '#2C59A7',
  '#F5A623',
  '#4CAF50',
  '#C73935',
  '#8E5FC7',
  '#0E7C86',
  '#D99B12',
  '#B0446E',
  '#4A6FA5',
  '#C1652C',
  '#1F8A6F',
];

export interface Series {
  code: string;
  name: string;
  color: string;
  values: (number | null)[];
}

/** Baseline → midterms → endterm, keeping only periods that carry a year. */
export function orderedPeriods(chart: DeepAnalysisChart): MemberStatePeriod[] {
  const data = chart.memberStateData;
  if (!data) return [];
  return [data.baseline, ...data.midterms, data.endterm].filter(
    (p): p is MemberStatePeriod => p !== null && p.year !== null,
  );
}

/** One series per member state; a state missing from a period gets null there. */
export function buildSeries(periods: readonly MemberStatePeriod[]): Series[] {
  const byCode = new Map<string, Series>();
  periods.forEach((period, periodIndex) => {
    for (const row of period.rows) {
      let series = byCode.get(row.country_code);
      if (!series) {
        series = {
          code: row.country_code,
          name: row.country_name ?? row.country_code,
          color: SERIES_COLORS[byCode.size % SERIES_COLORS.length] ?? '#2C59A7',
          values: periods.map(() => null),
        };
        byCode.set(row.country_code, series);
      }
      series.values[periodIndex] = row.value;
    }
  });
  return [...byCode.values()];
}

export interface NiceScale {
  min: number;
  max: number;
  ticks: number[];
}

/** 1 / 2 / 2.5 / 5 × 10ⁿ steps, at most six intervals — works for 0.96 as well as 96. */
export function niceScale(minValue: number, maxValue: number): NiceScale {
  const low = Math.min(0, minValue);
  const high = Math.max(maxValue, low + Number.EPSILON);
  const rough = (high - low) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => (high - low) / s <= 6) ??
    10 * magnitude;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil((high * 1.05) / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { min, max, ticks };
}
