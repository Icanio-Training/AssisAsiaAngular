import type { DeepAnalysis } from '../models/blueprint-kpi.models';
import {
  buildUpdateBody,
  draftFrom,
  EMPTY_ENTRIES,
  formatBlocks,
  niceScale,
} from './deep-analysis';
import { parseKpiParam } from './kpi-param';

const record = {
  id: 5,
  kpiDetailId: 9,
  leadOrCoLeadSb: 'SOMRI',
  dataSourceStatus: null,
  smDescription: 'Old',
  operationalDefinition: 'Def',
  identifiedDataSource: null,
  progress: [],
  documentRequests: [{ message: 'existing', at: '2026-01-01T00:00:00Z' }],
  amdComments: [],
} as unknown as DeepAnalysis;

describe('buildUpdateBody', () => {
  it('sends blank fields as null and keeps the rest of the record', () => {
    const body = buildUpdateBody(
      record,
      { ...draftFrom(record), smDescription: '   ', leadOrCoLeadSb: 'SOMSWD' },
      EMPTY_ENTRIES,
    );
    expect(body).toEqual({
      id: 5,
      kpiDetailId: 9,
      leadOrCoLeadSb: 'SOMSWD',
      dataSourceStatus: null,
      smDescription: null,
      operationalDefinition: 'Def',
      identifiedDataSource: null,
      progress: [],
      documentRequests: record.documentRequests,
      amdComments: [],
    });
  });

  it('appends only non-empty, trimmed new log entries', () => {
    const body = buildUpdateBody(record, draftFrom(record), {
      documentRequests: '  please send data  ',
      amdComments: '   ',
    });
    expect(body.documentRequests).toEqual([
      { message: 'existing', at: '2026-01-01T00:00:00Z' },
      { message: 'please send data' },
    ]);
    expect(body.amdComments).toEqual([]);
    expect(record.documentRequests).toHaveLength(1); // the record is not mutated
  });
});

describe('niceScale', () => {
  it('builds round ticks from zero for percentages', () => {
    expect(niceScale(12, 96)).toEqual({ min: 0, max: 120, ticks: [0, 20, 40, 60, 80, 100, 120] });
  });

  it('handles small fractional values', () => {
    const scale = niceScale(0.1, 0.96);
    expect(scale.min).toBe(0);
    expect(scale.max).toBeGreaterThanOrEqual(0.96);
    expect(scale.ticks.length).toBeLessThanOrEqual(7);
  });

  it('includes negative minimums', () => {
    expect(niceScale(-10, 40).min).toBeLessThanOrEqual(-10);
  });
});

describe('formatBlocks', () => {
  it('turns "-", "•" and "1." lines into a bullet list between paragraphs', () => {
    expect(formatBlocks('Intro\n- one\n• two\n2) three\nOutro')).toEqual([
      { kind: 'p', text: 'Intro' },
      { kind: 'ul', items: ['one', 'two', 'three'] },
      { kind: 'p', text: 'Outro' },
    ]);
  });
});

describe('parseKpiParam', () => {
  it('accepts only positive integers', () => {
    expect(parseKpiParam('7')).toBe(7);
    expect(parseKpiParam(undefined)).toBeNull();
    expect(parseKpiParam('')).toBeNull();
    expect(parseKpiParam('0')).toBeNull();
    expect(parseKpiParam('1.5')).toBeNull();
    expect(parseKpiParam('abc')).toBeNull();
  });
});
