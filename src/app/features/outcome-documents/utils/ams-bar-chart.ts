// Ported from the React app: features/outcome-documents/constants/amsBarChart.ts (pure functions).

/** Cambodia's code differs between endpoints: `dashboard/charts` uses `CA`, the country
    dropdown uses ISO `KH`. Normalize to `CA` so lookups work with either. */
export function normalizeAmsCode(code: string): string {
  const upper = code.toUpperCase();
  return upper === 'KH' || upper === 'CM' ? 'CA' : upper;
}

/* Bar gradient per COUNTRY (client-confirmed), keyed by the charts API's codes. */
const VBAR_GRADIENT_STOPS: Record<string, readonly string[]> = {
  BN: ['#E4D12A 0%', '#1B1B1B 100%'],
  CA: ['#1E4CAA 0%', '#EDEDED 50%', '#C02133 100%'],
  ID: ['#DC2222 0%', '#EDEDED 100%'],
  LA: ['#CF3343 0%', '#22447A 50%', '#D13344 100%'],
  MY: ['#F7D01F 0%', '#242576 50%', '#C53D35 100%'],
  MM: ['#D13142 0%', '#B19728 50%', '#D33444 100%'],
  PH: ['#1E4CAA 0%', '#EDEDED 50%', '#C02133 100%'],
  SG: ['#DC2222 0%', '#EDEDED 100%'],
  TH: ['#DC2222 0%', '#EDEDED 100%'],
  TL: ['#D13142 0%', '#B19728 50%', '#D33444 100%'],
  VN: ['#D13142 0%', '#B19728 50%', '#D33444 100%'],
};

const DEFAULT_GRADIENT_STOPS = ['#2C59A7 0%', '#1A3A6B 100%'];

export function vbarGradientFor(code: string): string {
  const stops = VBAR_GRADIENT_STOPS[normalizeAmsCode(code)] ?? DEFAULT_GRADIENT_STOPS;
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

/* Flag watermark per country — images live in public/assets. */
const FLAG_WATERMARK: Record<string, string> = {
  BN: 'assets/brunei.png',
  CA: 'assets/cambodia.png',
  ID: 'assets/indonesia.png',
  LA: 'assets/lao-pdr.png',
  MY: 'assets/malaysia.png',
  MM: 'assets/myanmar.png',
  PH: 'assets/philippines.png',
  SG: 'assets/singapore.png',
  TH: 'assets/thailand.png',
  VN: 'assets/vietnam.png',
  TL: 'assets/timor-Leste.png',
};

export function flagFor(code: string): string | undefined {
  return FLAG_WATERMARK[normalizeAmsCode(code)];
}

export const VBAR_TRACK_HEIGHT = 380;
export const VBAR_MIN_BAR_HEIGHT = 92;

/** `MIN + count / max × (TRACK − MIN)` — every distinct count gets a distinct height. */
export function vbarHeightFor(count: number, maxCount: number): number {
  const maxV = Math.max(1, maxCount);
  const share = Math.min(Math.max(count, 0) / maxV, 1);
  return Math.round(VBAR_MIN_BAR_HEIGHT + share * (VBAR_TRACK_HEIGHT - VBAR_MIN_BAR_HEIGHT));
}

export const AMS_BAR_NUM_TICKS = 5;
export const AMS_BAR_GRIDLINE_PCTS: readonly number[] = [20, 40, 60, 80, 100];

export interface AxisTick {
  readonly pct: number;
  readonly val: number;
  readonly transform: string;
}

/** 6 evenly spaced axis labels from 0 to max (first left-aligned, last right-aligned). */
export function buildAxisTicks(maxVal: number): AxisTick[] {
  return Array.from({ length: AMS_BAR_NUM_TICKS + 1 }, (_, i) => ({
    pct: (i / AMS_BAR_NUM_TICKS) * 100,
    val: maxVal > 0 ? Math.round((maxVal * i) / AMS_BAR_NUM_TICKS) : 0,
    transform:
      i === 0
        ? 'translateX(0)'
        : i === AMS_BAR_NUM_TICKS
          ? 'translateX(-100%)'
          : 'translateX(-50%)',
  }));
}

/** Highest count first; a stable copy (never mutates the API array). */
export function sortByCountDesc<T extends { count: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count);
}
