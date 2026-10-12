import {
  OBJECTIVE_SHORT_NAMES,
  STRATEGIC_GOAL_SHORT_TITLES,
} from '../constants/strategic-goal-cards';
import type {
  DeepAnalysis,
  DeepAnalysisChart,
  KpiBanner,
  MemberStatePeriod,
  StrategicGoalDetail,
  StrategicGoalSummary,
} from '../models/blueprint-kpi.models';

// In-memory "database" for the mock API, shaped after sm-kpi-api-documentation.html and the
// React fixtures (tests/fixtures/blueprintKpi.ts). Generated deterministically so every
// goal has objectives → strategic measures → KPIs → deep analyses with progress charts.

const MEMBER_STATES: readonly [string, string][] = [
  ['BN', 'Brunei Darussalam'],
  ['KH', 'Cambodia'],
  ['ID', 'Indonesia'],
  ['LA', 'Lao PDR'],
  ['MY', 'Malaysia'],
  ['MM', 'Myanmar'],
  ['PH', 'Philippines'],
  ['SG', 'Singapore'],
  ['TH', 'Thailand'],
  ['TL', 'Timor-Leste'],
  ['VN', 'Viet Nam'],
];

const SECTORAL_BODIES = ['SOMRI', 'SOMSWD', 'SOMED', 'SOMHD', 'SOMY', 'SOCA', 'ACW', 'SOMS'];

const KPI_TOPICS = [
  'Increase in the percentage of population with broadband access',
  'Increase in digital literacy among youth and adults',
  'Reduction in the proportion of population living below the national poverty line',
  'Increase in social protection coverage for vulnerable groups',
  'Increase in the completion rate of upper secondary education',
  'Reduction in maternal mortality ratio',
  'Increase in the number of regional cultural heritage programmes',
  'Increase in female labour force participation',
];

/** Small deterministic pseudo-random generator (same data on every reload). */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function period(year: number, values: (number | null)[], withSources: boolean): MemberStatePeriod {
  return {
    year,
    rows: MEMBER_STATES.map(([code, name], i) => ({
      country_code: code,
      country_name: name,
      data_source: withSources && i % 4 !== 3 ? `National Statistics Office of ${name}` : null,
      value: values[i] ?? null,
    })),
  };
}

function buildChart(
  id: number,
  title: string,
  random: () => number,
  percent: boolean,
): DeepAnalysisChart {
  const scale = percent ? 100 : 1;
  const base = MEMBER_STATES.map(() => Math.round(random() * 60 * scale) / (percent ? 100 : 1));
  const grow = (values: number[], factor: number) =>
    values.map((v, i) => (i === 9 && factor > 1.2 ? null : Math.round(v * factor * 100) / 100));
  return {
    id,
    chartType: 'line',
    chartTitle: title,
    yAxis: { type: percent ? 'percentage' : 'number', min: 0, max: 100, interval: 20 },
    years: { baseline: 2025, midterms: [2028], endterm: 2030 },
    identifiedDataSource: id % 3 === 0 ? 'ASEAN Statistical Yearbook (ASEANstats)' : null,
    memberStateData: {
      baseline: period(2025, base, true),
      midterms: [period(2028, grow(base, 1.15), false)],
      endterm: period(2030, grow(base, 1.3), false),
    },
  };
}

export interface MockKpiDb {
  banner: KpiBanner;
  goals: StrategicGoalDetail[];
  deepAnalyses: DeepAnalysis[];
}

export function createKpiDb(): MockKpiDb {
  const goals: StrategicGoalDetail[] = [];
  const deepAnalyses: DeepAnalysis[] = [];
  let objectiveId = 10;
  let measureId = 17;
  let kpiDetailId = 1;
  let deepAnalysisId = 2;
  let chartId = 1;
  let topic = 0;

  for (let n = 1; n <= 12; n++) {
    const code = `SG${n}`;
    const random = seeded(n * 97);
    const objectiveNames = OBJECTIVE_SHORT_NAMES[code] ?? [];
    const objectives = objectiveNames.map((name, o) => {
      const objectiveCode = `${n}.${o + 1}`;
      const measures = [1, 2].map((m) => {
        const measureCode = `${objectiveCode}.${m}`;
        const lead = SECTORAL_BODIES[(n + m) % SECTORAL_BODIES.length] ?? 'SOMRI';
        const smId = measureId++;
        // The second measure of every other objective has one KPI with no deep analysis yet.
        const kpiCount = m === 1 ? 2 : 1;
        const kpis = Array.from({ length: kpiCount }, (_, k) => {
          const kpiCode = `${measureCode}.${k + 1}`;
          const description = KPI_TOPICS[topic++ % KPI_TOPICS.length] ?? null;
          const hasAnalysis = !(m === 2 && o % 2 === 1);
          const detailId = kpiDetailId++;
          const daId = hasAnalysis ? deepAnalysisId++ : null;
          if (daId !== null) {
            const charts = [
              buildChart(chartId++, `${description ?? 'Progress'} (%)`, random, true),
            ];
            if (k === 1)
              charts.push(buildChart(chartId++, 'Number of national programmes', random, false));
            deepAnalyses.push({
              id: daId,
              kpiDetailId: detailId,
              kpiCode,
              kpiName: description,
              strategicMeasure: { id: smId, code: measureCode, name: measureCode },
              leadOrCoLeadSb: lead,
              coLead: null,
              supportingSbs: 'SOMSWD, SOMHD',
              dataSourceStatus: k === 0 ? 'Available — national data collected annually' : null,
              smDescription: `Strengthen regional cooperation to deliver ${name.toLowerCase()}.\n- Develop regional guidelines\n- Share good practices among AMS`,
              operationalDefinition:
                k === 0
                  ? `Percentage of the target population covered, measured at national level.\n1. Numerator: population covered\n2. Denominator: total target population`
                  : null,
              identifiedDataSource: 'National statistics offices; ASEANstats',
              baselineData: null,
              target: 'Increase by 30% by 2030',
              monitoringYear: 2025,
              monitoringStatus: 'On track',
              progress: charts,
              documentRequests:
                k === 0
                  ? [
                      {
                        message: 'Please submit the 2025 national baseline figures.',
                        country_code: 'KH',
                        by: 'Aisha Rahman',
                        at: '2026-03-14T09:30:00Z',
                      },
                    ]
                  : [],
              amdComments: [],
              createdBy: { id: '1', name: 'Aisha Rahman', email: 'admin@adme.test' },
              updatedBy: null,
              createdAt: '2026-01-10T08:00:00Z',
              updatedAt: '2026-03-14T09:30:00Z',
            });
          }
          return {
            deepAnalysisId: daId,
            kpiDetailId: detailId,
            code: kpiCode,
            description,
            leadOrCoLeadSb: lead,
          };
        });
        return {
          id: smId,
          code: measureCode,
          name: measureCode,
          description: `Enhance regional and national mechanisms for ${name.toLowerCase()}.`,
          leadSb: lead,
          kpiCount: kpis.length,
          kpis,
        };
      });
      return {
        id: objectiveId++,
        code: objectiveCode,
        label: objectiveCode,
        description: `To achieve ${name.toLowerCase()}.`,
        strategicMeasuresCount: measures.length,
        strategicMeasures: measures,
      };
    });
    goals.push({
      id: n,
      code,
      label: String(n),
      title: `Strategic Goal ${n}`,
      description: `${STRATEGIC_GOAL_SHORT_TITLES[code] ?? ''}.`,
      objectivesCount: objectives.length,
      strategicMeasuresCount: objectives.reduce((sum, o) => sum + o.strategicMeasuresCount, 0),
      objectives,
    });
  }

  const totalMeasures = goals.reduce((sum, g) => sum + g.strategicMeasuresCount, 0);
  const totalKpis = goals
    .flatMap((g) => g.objectives)
    .flatMap((o) => o.strategicMeasures)
    .reduce((sum, m) => sum + m.kpiCount, 0);

  return {
    banner: {
      group: 'kpi',
      title: "ASCC Strategic Plan's Key Performance Indicator",
      description:
        "This section provides data on the Key Performance Indicators of the ASCC Strategic Plan's KPIs.",
      strategicGoals: goals.length,
      totalStrategicMeasures: totalMeasures,
      totalKPIs: totalKpis,
    },
    goals,
    deepAnalyses,
  };
}

export function toSummary(goal: StrategicGoalDetail): StrategicGoalSummary {
  return {
    id: goal.id,
    code: goal.code,
    label: goal.label,
    title: goal.title,
    description: goal.description,
    objectivesCount: goal.objectivesCount,
  };
}
