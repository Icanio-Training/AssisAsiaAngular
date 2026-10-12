// Ported from the React app: constants/declarationOptions.ts + constants/asccKpiOptions.ts.
// Flags are served from public/assets (React imported them as modules).

export interface AmsCountry {
  readonly code: string;
  readonly name: string;
  readonly flag: string;
}

export const AMS_COUNTRIES: readonly AmsCountry[] = [
  { code: 'BN', name: 'Brunei Darussalam', flag: 'assets/brunei.png' },
  { code: 'KH', name: 'Cambodia', flag: 'assets/cambodia.png' },
  { code: 'ID', name: 'Indonesia', flag: 'assets/indonesia.png' },
  { code: 'LA', name: 'Lao PDR', flag: 'assets/lao-pdr.png' },
  { code: 'MY', name: 'Malaysia', flag: 'assets/malaysia.png' },
  { code: 'MM', name: 'Myanmar', flag: 'assets/myanmar.png' },
  { code: 'PH', name: 'Philippines', flag: 'assets/philippines.png' },
  { code: 'SG', name: 'Singapore', flag: 'assets/singapore.png' },
  { code: 'TH', name: 'Thailand', flag: 'assets/thailand.png' },
  { code: 'TL', name: 'Timor-Leste', flag: 'assets/timor-Leste.png' },
  { code: 'VN', name: 'Vietnam', flag: 'assets/vietnam.png' },
];

export function flagForCountry(code: string): string | undefined {
  return AMS_COUNTRIES.find((c) => c.code === code)?.flag;
}

/** Tool 3's deep-analysis API keys member states by ISO alpha-3. */
export interface MemberState {
  readonly code: string;
  readonly name: string;
  readonly flag: string;
}

const ISO3_BY_ISO2: Readonly<Record<string, { code: string; name: string }>> = {
  BN: { code: 'BRN', name: 'Brunei Darussalam' },
  KH: { code: 'KHM', name: 'Cambodia' },
  ID: { code: 'IDN', name: 'Indonesia' },
  LA: { code: 'LAO', name: 'Lao PDR' },
  MY: { code: 'MYS', name: 'Malaysia' },
  MM: { code: 'MMR', name: 'Myanmar' },
  PH: { code: 'PHL', name: 'Philippines' },
  SG: { code: 'SGP', name: 'Singapore' },
  TH: { code: 'THA', name: 'Thailand' },
  TL: { code: 'TLS', name: 'Timor-Leste' },
  VN: { code: 'VNM', name: 'Viet Nam' },
};

export const MEMBER_STATES: readonly MemberState[] = AMS_COUNTRIES.flatMap((country) => {
  const iso3 = ISO3_BY_ISO2[country.code];
  return iso3 ? [{ ...iso3, flag: country.flag }] : [];
});

export function flagForMemberState(code: string): string | undefined {
  return MEMBER_STATES.find((m) => m.code === code)?.flag;
}

export const CHART_TYPE_OPTIONS = [
  { value: 'line', label: 'Line Chart' },
  { value: 'bar', label: 'Bar Chart' },
] as const;

export const Y_AXIS_TYPE_OPTIONS = [{ value: 'numeric', label: 'Numeric' }] as const;

/** Same 2010–2035 range as the Admin Flow prototype's year pickers. */
export const PROGRESS_YEAR_OPTIONS: readonly string[] = Array.from({ length: 26 }, (_, i) =>
  String(2010 + i),
);

export const Y_AXIS_LIMIT = 99.99;
export const Y_AXIS_MIN_INTERVAL = 0.01;
export const MAX_CHARTS = 5;
export const MAX_MIDTERMS = 6;

/** One distinct series color per member state on the review chart. */
export const MEMBER_STATE_COLORS: readonly string[] = [
  '#2F5BD6',
  '#F5A623',
  '#16A34A',
  '#DC2626',
  '#8B5CF6',
  '#0891B2',
  '#DB2777',
  '#65A30D',
  '#EA580C',
  '#475569',
  '#9333EA',
];
