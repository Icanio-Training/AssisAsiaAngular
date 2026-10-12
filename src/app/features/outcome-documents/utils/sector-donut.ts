// Ported from the React app: features/outcome-documents/utils/sectorDonut.ts
import type { SectorDistribution } from '../models/outcome-documents.models';

/* 12-color palette — the ASEAN brand colors. */
export const DONUT_PALETTE: readonly string[] = [
  '#2C59A7',
  '#C73535',
  '#6C3694',
  '#58946E',
  '#D99534',
  '#639AC0',
  '#574DA1',
  '#AB138B',
  '#CF6C31',
  '#EBCA39',
  '#A4C747',
  '#1A3A6B',
];

/** Compact sector names for the legend and center readout. */
export function shortSectorName(sector: string): string {
  return sector
    .replace('Disaster Management and Humanitarian Assistance', 'DM & HA')
    .replace('Information and Media', 'Info & Media')
    .replace(' and ', ' & ');
}

export interface SectorSlice {
  readonly sector: string;
  readonly count: number;
  /** Share of total in percent, one decimal. */
  readonly share: number;
  readonly color: string;
}

/** API rows → display-ready slices, sorted descending, colored, with shares. */
export function buildSectorSlices(rows: readonly SectorDistribution[]): SectorSlice[] {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, r) => sum + r.count, 0);
  return sorted.map((row, i) => ({
    sector: row.sector,
    count: row.count,
    share: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    color: DONUT_PALETTE[i % DONUT_PALETTE.length] ?? '#2C59A7',
  }));
}

/** Non-hovered slices dim to ~28% opacity ('47' hex alpha). */
export function dimmed(hex: string): string {
  return `${hex}47`;
}
