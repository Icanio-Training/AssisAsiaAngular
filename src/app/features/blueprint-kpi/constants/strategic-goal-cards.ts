// Ported from the React app: src/features/blueprint-kpi/constants/strategicGoalCards.ts
// Images are plain paths under public/ (React imported them through Vite).

export type StrategicGoalCode =
  'SG1' | 'SG2' | 'SG3' | 'SG4' | 'SG5' | 'SG6' | 'SG7' | 'SG8' | 'SG9' | 'SG10' | 'SG11' | 'SG12';

export const EXPLORE_TITLE = "Explore ASCC Strategic Plan's KPIs";
export const EXPLORE_DESCRIPTION =
  "This section provides data on the Key Performance Indicators of the ASCC Strategic Plan's KPIs which includes targets and baselines.";

export const KPI_SECTION_LABEL = 'ASCC Strategic Plan KPIs';

export const HERO_STAT_LABELS = {
  strategicGoalCount: 'Strategic Goals',
  strategicMeasureCount: 'Total Strategic Measures',
  kpiCount: 'Total KPIs',
} as const;

/* PENDING API — GET /strategic-goals has no short headline ("title" is
   "Strategic Goal N") and no objective names (only objectivesCount), but the
   cards and the Objectives tooltip need both. Short names verbatim from the
   ASCC Strategic Plan Approved Overview file, keyed by goal / objective code. */
export const STRATEGIC_GOAL_SHORT_TITLES: Readonly<Record<string, string>> = {
  SG1: 'A people-centred, people-oriented, and interconnected ASEAN',
  SG2: 'A caring community',
  SG3: 'ASEAN as the epicentre of growth and innovation',
  SG4: 'A healthy population',
  SG5: 'Active participation of ASEAN peoples in all aspects of life',
  SG6: 'Shared ASEAN identity',
  SG7: 'Women empowerment',
  SG8: 'Meaningful participation of youth',
  SG9: 'Preservation, conservation, and value creation of cultural heritage, arts, and traditions',
  SG10: 'Sports development',
  SG11: 'Narrowing the development gap',
  SG12: 'Sustainable growth',
};

export const OBJECTIVE_SHORT_NAMES: Readonly<Record<string, readonly string[]>> = {
  SG1: [
    'Inclusive and sustainable digital transformation',
    'Integrative and participative community',
  ],
  SG2: ['Equitable and shared prosperity for all'],
  SG3: ['Digital innovation for transformative education and lifelong learning'],
  SG4: [
    'Resilient community that promotes human security',
    'Thriving, healthy, and resilient ASEAN',
  ],
  SG5: ['Enhanced partnership and collaboration for sustainable progress'],
  SG6: ['Adaptive and responsive community amidst regional and global challenges'],
  SG7: ['Effective and meaningful participation of women in ASEAN Community building'],
  SG8: ['Increased youth engagement in economic, environment, and socio-cultural development'],
  SG9: ['Heightened ASEAN awareness and increased sense of belonging'],
  SG10: [
    'Preserved traditional sports and games and sports for socio-economic development and well-being',
  ],
  SG11: [
    'Enhanced social and economic well-being',
    'Resiliency towards crises, emergencies, and climate change',
  ],
  SG12: ["Advances ASEAN's sustainability agendas", 'Digitalisation for a green ASEAN'],
};

/** "Strategic Goal 1. A people-centred, …" — falls back to the API title alone. */
export function strategicGoalFullTitle(goal: { code: string; title: string }): string {
  const short = STRATEGIC_GOAL_SHORT_TITLES[goal.code];
  return short ? `${goal.title}. ${short}` : goal.title;
}

/** "SG1. A people-centred, …" — the compact form used in the breadcrumb trail. */
export function strategicGoalBreadcrumbLabel(goal: { code: string; title: string }): string {
  const short = STRATEGIC_GOAL_SHORT_TITLES[goal.code];
  return short ? `${goal.code}. ${short}` : goal.title;
}

/** Visual identity per goal — stays on the frontend; the API only supplies data. */
export function strategicGoalImage(code: StrategicGoalCode): string {
  return `assets/blueprint-kpi/${code.toLowerCase()}.svg`;
}

/** Card scrim tint and detail-page accent (blueprint CARD_TINTS / PILLAR_COLORS.color). */
export const STRATEGIC_GOAL_TINTS: Readonly<Record<StrategicGoalCode, string>> = {
  SG1: '#00445E',
  SG2: '#206448',
  SG3: '#E59D2B',
  SG4: '#E96D25',
  SG5: '#802919',
  SG6: '#4E9BA7',
  SG7: '#1D7A7A',
  SG8: '#9B6AAC',
  SG9: '#D04327',
  SG10: '#373D39',
  SG11: '#695425',
  SG12: '#799349',
};

/** Readable accent for text on light backgrounds (blueprint PILLAR_COLORS.textColor). */
export const STRATEGIC_GOAL_ACCENT_TEXT: Readonly<Record<StrategicGoalCode, string>> = {
  SG1: '#00445E',
  SG2: '#206448',
  SG3: '#734F16',
  SG4: '#753713',
  SG5: '#802919',
  SG6: '#274E54',
  SG7: '#0F3D3D',
  SG8: '#4E3556',
  SG9: '#682214',
  SG10: '#1C1F1D',
  SG11: '#352A13',
  SG12: '#3D4A25',
};

export function isStrategicGoalCode(code: string): code is StrategicGoalCode {
  return code in STRATEGIC_GOAL_TINTS;
}

export type CardSize = 'tall' | 'medium' | 'short';

export const CARD_MIN_HEIGHT: Readonly<Record<CardSize, string>> = {
  tall: 'min-h-[338px]',
  medium: 'min-h-[250px]',
  short: 'min-h-[200px]',
};

/* Arch silhouette (tall→medium→short→short→medium→tall) with a snake reading
   order: top row SG1→SG6 left→right, bottom row SG7→SG12 right→left. */
export const CARD_LAYOUT: readonly {
  top: StrategicGoalCode;
  bottom: StrategicGoalCode;
  size: CardSize;
}[] = [
  { top: 'SG1', bottom: 'SG12', size: 'tall' },
  { top: 'SG2', bottom: 'SG11', size: 'medium' },
  { top: 'SG3', bottom: 'SG10', size: 'short' },
  { top: 'SG4', bottom: 'SG9', size: 'short' },
  { top: 'SG5', bottom: 'SG8', size: 'medium' },
  { top: 'SG6', bottom: 'SG7', size: 'tall' },
];

export const ARIAL_MEDIUM = 'font-medium [-webkit-text-stroke:0.2px_currentColor]';

/** Text colour on an accent-filled button (Save, Download) — dark only where
    white would fail contrast (blueprint PILLAR_COLORS.onFill). */
const ACCENT_ON_FILL: Partial<Record<StrategicGoalCode, string>> = { SG3: '#10192B' };

const FALLBACK_ACCENT = '#2C59A7';

/** CSS custom properties for a goal's accent; children read them via var().
    Bound with `[style]="accentStyle()"` (React: style={goalAccentStyle(code)}). */
export function goalAccentStyle(code: string): Record<string, string> {
  const known = isStrategicGoalCode(code);
  const accent = known ? STRATEGIC_GOAL_TINTS[code] : FALLBACK_ACCENT;
  return {
    '--accent': accent,
    '--accent-light': `color-mix(in srgb, ${accent} 12%, transparent)`,
    '--accent-text': known ? STRATEGIC_GOAL_ACCENT_TEXT[code] : FALLBACK_ACCENT,
    '--accent-on-fill': (known ? ACCENT_ON_FILL[code] : undefined) ?? '#FFFFFF',
  };
}

export const NO_DATA = 'No Data Available';

export function hasValue(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim() !== '';
}
