import type { HttpRequest } from '@angular/common/http';

import { DASHBOARD_ENDPOINTS } from '@core/constants/dashboard-endpoints';
import {
  fail,
  type MockRoute,
  ok,
  paginate,
  query,
  queryAll,
  raw,
  withUser,
} from '@core/mock-api/mock-utils';

import type {
  ActivityDetail,
  ActivityDetailItem,
  ActivityDetailsResponse,
} from '../models/activity-details.models';
import type {
  ActivityStatus,
  InitiativesChartsResponse,
  InitiativesSummaryResponse,
  StrategicGoalCounts,
} from '../models/initiatives.models';
import type {
  DropdownOption,
  DropdownsResponse,
  ObjectiveDropdownOption,
  StrategicGoalDropdownOption,
  StrategicMeasureDropdownOption,
} from '../models/initiatives-filters.models';

// CONCEPT: in-memory mock backend data | REACT: tests/fixtures/initiatives.ts + MSW handlers (tests/setup/handlers/initiatives.ts) | INTERVIEW: the handlers filter/sort/page a seeded array exactly like the Laravel API would, so the UI can be demoed with no server.

// ---------------------------------------------------------------------------
// Lookup tables (same ids/names shape as the React fixtures, extended)
// ---------------------------------------------------------------------------
const PERIODS: DropdownOption[] = [
  { id: 1, name: '2016-2020' },
  { id: 2, name: '2021-2025' },
  { id: 3, name: '2016-2025' },
];
const STATUS_NAMES: ActivityStatus[] = ['Completed', 'Ongoing', 'Upcoming', 'Withdrawn', 'Removed'];
const STATUSES: DropdownOption[] = STATUS_NAMES.map((name, i) => ({ id: i + 1, name }));
const SECTORAL_BODIES: DropdownOption[] = [
  'SOCA',
  'SOMSWD',
  'SOMHD',
  'SLOM',
  'SOMY',
  'SOMED',
  'ACDM',
  'ASOEN',
  'SOMS',
  'AMRI',
].map((name, i) => ({ id: 10 + i, name }));
const ACTIVITY_TYPES: DropdownOption[] = [
  { id: 30, name: 'Capacity Building' },
  { id: 31, name: 'Groundwork' },
  { id: 32, name: 'Policy Dialogue' },
  { id: 33, name: 'Research' },
];
const FREQUENCIES: DropdownOption[] = [
  { id: 40, name: 'One off' },
  { id: 41, name: 'Recurring' },
  { id: 42, name: 'Annual' },
];

const GOAL_DESCRIPTIONS = [
  'Inclusive social development',
  'Inclusive human development',
  'Sustainable and resilient communities',
  'Dynamic and creative community',
];
const STRATEGIC_GOALS: StrategicGoalDropdownOption[] = GOAL_DESCRIPTIONS.map((description, i) => ({
  id: i + 1,
  code: `SG${i + 1}`,
  name: `STRATEGIC GOAL ${i + 1}`,
  description,
}));
const OBJECTIVES: ObjectiveDropdownOption[] = STRATEGIC_GOALS.flatMap((goal, g) =>
  [1, 2].map((k) => ({
    id: (g + 1) * 10 + k,
    code: `${g + 1}.${k}`,
    name: `OBJECTIVE ${g + 1}.${k}`,
    description: `Objective ${g + 1}.${k}: advance ${goal.description.toLowerCase()} across ASEAN Member States.`,
    strategicGoalId: goal.id,
  })),
);
const MEASURES: (StrategicMeasureDropdownOption & { description: string })[] = OBJECTIVES.flatMap(
  (objective) =>
    [1, 2].map((m) => ({
      id: objective.id * 10 + m,
      code: `${objective.code}.${m}`,
      name: `SM ${objective.code}.${m}`,
      description: `Strategic measure ${objective.code}.${m}`,
      objectiveId: objective.id,
    })),
);

// ---------------------------------------------------------------------------
// Seeded activities (deterministic — same data on every reload)
// ---------------------------------------------------------------------------
const TOPICS = [
  'Regional workshop on social protection',
  'Follow-up seminar on labour mobility',
  'Youth leadership exchange programme',
  'Study on disaster risk financing',
  'Training on inclusive education',
  'Policy dialogue on ageing populations',
  'Forum on cultural heritage preservation',
  'Survey of women entrepreneurship',
  'Network meeting of health officials',
  'Guidelines on climate-resilient cities',
];

interface MockActivity extends ActivityDetailItem {
  periodId: number;
  statusId: number;
  bodyId: number;
  typeId: number;
  frequencyId: number;
  goalCode: string;
  sortableDate: string;
  indicator: string | null;
  remarks: string | null;
}

function pick<T>(list: readonly T[], index: number): T {
  return list[index % list.length] as T;
}

const ACTIVITIES: MockActivity[] = Array.from({ length: 64 }, (_, i) => {
  const period = pick(PERIODS, i);
  const status = pick(STATUSES, (i * 7) % 11 < 5 ? 0 : i % 5);
  const body = pick(SECTORAL_BODIES, (i * 3) % 10);
  const type = pick(ACTIVITY_TYPES, i);
  const frequency = pick(FREQUENCIES, i * 2);
  const measure = pick(MEASURES, (i * 5) % MEASURES.length);
  const objective = OBJECTIVES.find((o) => o.id === measure.objectiveId) ?? pick(OBJECTIVES, 0);
  const day = String((i % 28) + 1).padStart(2, '0');
  const month = String((i % 12) + 1).padStart(2, '0');
  const year = 2024 + (i % 3);
  const time = `${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`;
  return {
    id: 100 + i,
    lastUpdate: `${day}/${month}/${year} ${time}`,
    sortableDate: `${year}-${month}-${day} ${time}`,
    activity: `${pick(TOPICS, i)} (${body.name} ${i + 1})`,
    sectoralBody: body.name,
    status: status.name as ActivityStatus,
    activityType: type.name,
    frequency: frequency.name,
    workplanCycle: period.name,
    objective: { id: objective.id, label: objective.name },
    strategicMeasure: { id: measure.id, label: measure.name },
    year,
    periodId: period.id,
    statusId: status.id,
    bodyId: body.id,
    typeId: type.id,
    frequencyId: frequency.id,
    goalCode: `SG${objective.strategicGoalId ?? 1}`,
    indicator: i % 3 === 0 ? null : 'Number of participants trained',
    remarks: i % 4 === 0 ? 'Carried over from the previous work plan.' : null,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function numbers(req: HttpRequest<unknown>, key: string): number[] {
  return queryAll(req, key).map(Number);
}

function optionalNumber(req: HttpRequest<unknown>, key: string): number | null {
  const value = query(req, key);
  return value ? Number(value) : null;
}

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

function filterForCharts(req: HttpRequest<unknown>): MockActivity[] {
  const period = numbers(req, 'period');
  const status = numbers(req, 'activityStatus');
  const body = numbers(req, 'sectoralBody');
  const goal = optionalNumber(req, 'strategicGoal');
  const objective = optionalNumber(req, 'objective');
  const measure = optionalNumber(req, 'strategicMeasure');
  return ACTIVITIES.filter(
    (a) =>
      (!period.length || period.includes(a.periodId)) &&
      (!status.length || status.includes(a.statusId)) &&
      (!body.length || body.includes(a.bodyId)) &&
      (goal === null || a.goalCode === `SG${goal}`) &&
      (objective === null || a.objective.id === objective) &&
      (measure === null || a.strategicMeasure.id === measure),
  );
}

function emptyGoals(): StrategicGoalCounts {
  return {
    SG1: 0,
    SG2: 0,
    SG3: 0,
    SG4: 0,
    SG5: 0,
    SG6: 0,
    SG7: 0,
    SG8: 0,
    SG9: 0,
    SG10: 0,
    SG11: 0,
    SG12: 0,
  };
}

function isImplemented(a: MockActivity): boolean {
  return a.status === 'Completed' || a.status === 'Ongoing';
}

function buildCharts(list: MockActivity[]): InitiativesChartsResponse {
  const asOf = 'As of 01 Oct 2026';
  const total = list.length;
  const byPeriod = PERIODS.map((p) => ({
    p,
    rows: list.filter((a) => a.periodId === p.id),
  })).filter((x) => x.rows.length > 0);
  const byBody = SECTORAL_BODIES.map((b) => ({
    b,
    rows: list.filter((a) => a.bodyId === b.id),
  })).filter((x) => x.rows.length > 0);
  const statusCount = (rows: MockActivity[], s: ActivityStatus) =>
    rows.filter((a) => a.status === s).length;

  return {
    asOfDate: '2026-10-01',
    activitiesPerPeriod: {
      title: 'Number of Activities per Period',
      asOf,
      items: byPeriod.map(({ p, rows }) => ({ period: p.name, count: rows.length })),
    },
    activitiesDistributionPerPeriod: {
      title: 'Activities Distribution per Work Plan Period',
      asOf,
      items: byPeriod.map(({ p, rows }) => ({
        period: p.name,
        count: rows.length,
        percentage: pct(rows.length, total),
      })),
    },
    completionAndImplementationRatesPerPeriod: {
      title: 'Implementation and Completion Rates Across Monitoring Periods',
      asOf,
      items: byPeriod.map(({ p, rows }) => ({
        period: p.name,
        completionRate: pct(statusCount(rows, 'Completed'), rows.length),
        implementationRate: pct(rows.filter(isImplemented).length, rows.length),
        ongoingRate: pct(statusCount(rows, 'Ongoing'), rows.length),
      })),
    },
    activitiesPerObjective: {
      title: 'Distribution of Activities per Objective',
      asOf,
      items: OBJECTIVES.map((o) => {
        const count = list.filter((a) => a.objective.id === o.id).length;
        return { code: o.name, count, percentage: pct(count, total) };
      }).filter((x) => x.count > 0),
    },
    activitiesPerStrategicMeasure: {
      title: 'Distribution of Activities per Strategic Measure',
      asOf,
      items: MEASURES.map((m) => {
        const count = list.filter((a) => a.strategicMeasure.id === m.id).length;
        return { code: m.name, count, percentage: pct(count, total) };
      }),
    },
    activitiesPerSectoralBody: {
      title: 'Distribution of Activities per ASCC Sectoral Body',
      asOf,
      summary: `${total} activities across ${byBody.length} sectoral bodies`,
      totalActivities: total,
      totalSectoralBodies: byBody.length,
      items: byBody.map(({ b, rows }) => ({ code: b.name, count: rows.length })),
    },
    statusActivitiesPerSectoralBody: {
      title: 'Status of Activities per Sectoral Body',
      asOf,
      legend: STATUS_NAMES.map((status) => ({ status, count: statusCount(list, status) })),
      items: byBody.map(({ b, rows }) => ({
        code: b.name,
        total: rows.length,
        statuses: {
          completed: statusCount(rows, 'Completed'),
          ongoing: statusCount(rows, 'Ongoing'),
          upcoming: statusCount(rows, 'Upcoming'),
          withdrawn: statusCount(rows, 'Withdrawn'),
          removed: statusCount(rows, 'Removed'),
        },
      })),
    },
    implementationAndCompletionRates: {
      title: 'Implementation & Completion Rates per Sectoral Body (%)',
      asOf,
      items: byBody.map(({ b, rows }) => ({
        code: b.name,
        implementationRate: pct(rows.filter(isImplemented).length, rows.length),
        completionRate: pct(statusCount(rows, 'Completed'), rows.length),
        implementationActivity: rows.filter(isImplemented).length,
        completionActivity: statusCount(rows, 'Completed'),
      })),
    },
    activitiesPerStrategicGoal: {
      title: 'Distribution of Activities under each Strategic Goal',
      asOf,
      items: byBody.map(({ b, rows }) => {
        const goals = emptyGoals();
        for (const a of rows) goals[a.goalCode as keyof StrategicGoalCounts] += 1;
        return { code: b.name, total: rows.length, goals };
      }),
    },
  };
}

function buildSummary(): InitiativesSummaryResponse {
  const total = ACTIVITIES.length;
  return {
    title: "ASCC Sectoral Bodies' Work Plans",
    description: "Tracking the progress of the ASCC Sectoral Work Plans' implementation.",
    totalActivities: total,
    completionRate: pct(ACTIVITIES.filter((a) => a.status === 'Completed').length, total),
    implementationRate: pct(ACTIVITIES.filter(isImplemented).length, total),
  };
}

const matches = (text: string, search: string) => text.toLowerCase().includes(search.toLowerCase());

function buildDropdowns(req: HttpRequest<unknown>): DropdownsResponse {
  const goal = optionalNumber(req, 'strategicGoal');
  const objective = optionalNumber(req, 'objective');
  const field = query(req, 'searchField');
  const search = query(req, 'search') ?? '';
  const searchIf = <T>(name: string, list: T[], text: (item: T) => string) =>
    field === name && search ? list.filter((item) => matches(text(item), search)) : list;

  return {
    periods: searchIf('period', PERIODS, (p) => p.name),
    statuses: searchIf('status', STATUSES, (s) => s.name),
    activityTypes: ACTIVITY_TYPES,
    frequencies: FREQUENCIES,
    sectoralBodies: searchIf('sectoralBody', SECTORAL_BODIES, (b) => b.name),
    strategicGoals: searchIf('strategicGoal', STRATEGIC_GOALS, (g) => `${g.name} ${g.description}`),
    // Narrowed server-side: empty until the parent level is given.
    objectives: goal === null ? [] : OBJECTIVES.filter((o) => o.strategicGoalId === goal),
    strategicMeasures: searchIf(
      'strategicMeasures',
      objective === null
        ? []
        : MEASURES.filter((m) => m.objectiveId === objective).map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropping `description` from the list payload
            ({ description: _d, ...m }) => m,
          ),
      (m) => `${m.code} ${m.name}`,
    ),
  };
}

type SortKey = 'lastUpdate' | 'activity' | 'sectoralBody' | 'status' | 'activityType' | 'frequency';
const SORT_KEYS: readonly SortKey[] = [
  'lastUpdate',
  'activity',
  'sectoralBody',
  'status',
  'activityType',
  'frequency',
];

function filterActivities(req: HttpRequest<unknown>): MockActivity[] {
  const period = numbers(req, 'period');
  const type = numbers(req, 'activityType');
  const frequency = numbers(req, 'frequency');
  const status = numbers(req, 'status');
  const body = numbers(req, 'sectoralBody');
  const objective = optionalNumber(req, 'objective');
  const measure = optionalNumber(req, 'strategicMeasure');
  const search = query(req, 'search') ?? '';
  const sortParam = query(req, 'sortBy') as SortKey | null;
  const sortBy: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'lastUpdate';
  const dir = query(req, 'sortDir') === 'desc' ? -1 : 1;
  const sortValue = (a: MockActivity) => (sortBy === 'lastUpdate' ? a.sortableDate : a[sortBy]);

  return ACTIVITIES.filter(
    (a) =>
      (!period.length || period.includes(a.periodId)) &&
      (!type.length || type.includes(a.typeId)) &&
      (!frequency.length || frequency.includes(a.frequencyId)) &&
      (!status.length || status.includes(a.statusId)) &&
      (!body.length || body.includes(a.bodyId)) &&
      (objective === null || a.objective.id === objective) &&
      (measure === null || a.strategicMeasure.id === measure) &&
      (!search || matches(`${a.activity} ${a.sectoralBody} ${a.activityType}`, search)),
  ).sort((a, b) => sortValue(a).localeCompare(sortValue(b)) * dir);
}

function toRow(a: MockActivity): ActivityDetailItem {
  const {
    id,
    lastUpdate,
    activity,
    sectoralBody,
    status,
    activityType,
    frequency,
    workplanCycle,
    objective,
    strategicMeasure,
    year,
  } = a;
  return {
    id,
    lastUpdate,
    activity,
    sectoralBody,
    status,
    activityType,
    frequency,
    workplanCycle,
    objective,
    strategicMeasure,
    year,
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toDetail(a: MockActivity): ActivityDetail {
  const [start = 0, end = 0] = a.workplanCycle.split('-').map(Number);
  const measure = MEASURES.find((m) => m.id === a.strategicMeasure.id);
  const goal = STRATEGIC_GOALS.find((g) => g.code === a.goalCode);
  return {
    id: a.id,
    lastUpdate: a.lastUpdate,
    asOf: `Last updated ${a.lastUpdate}`,
    activity: a.activity,
    sectoralBody: a.sectoralBody,
    status: a.status,
    activityType: a.activityType,
    workplanPeriod: a.workplanCycle,
    frequency: a.frequency,
    workplanStart: start,
    workplanComplete: end,
    activityCarryover: a.remarks ? 'Yes' : null,
    indicator: a.indicator,
    remarks: a.remarks,
    otherSectoralBody: null,
    strategicGoals: goal
      ? [{ code: goal.code, title: goal.description, description: goal.description }]
      : [],
    correspondingStrategicMeasures: measure
      ? [{ id: measure.id, code: measure.code, label: measure.name, name: measure.description }]
      : [],
    relatedActivities: ACTIVITIES.filter(
      (other) => other.id !== a.id && other.bodyId === a.bodyId && other.periodId === a.periodId,
    )
      .slice(0, 5)
      .map((other) => ({ id: other.id, activity: other.activity, status: other.status })),
  };
}

const findActivity = (id: string | undefined) => ACTIVITIES.find((a) => a.id === Number(id));

// ---------------------------------------------------------------------------
// Routes (paths are matched AFTER the /api/v1 prefix)
// ---------------------------------------------------------------------------
export const INITIATIVES_MOCK_ROUTES: MockRoute[] = [
  {
    method: 'GET',
    path: new RegExp(`^/${DASHBOARD_ENDPOINTS.banner}$`),
    handle: (req) => withUser(req, () => ok(buildSummary())),
  },
  {
    method: 'GET',
    path: new RegExp(`^/${DASHBOARD_ENDPOINTS.charts}$`),
    handle: (req) => withUser(req, () => ok(buildCharts(filterForCharts(req)))),
  },
  {
    method: 'GET',
    path: /^\/dropdowns\/strategicMeasures$/,
    handle: (req) =>
      withUser(req, () => {
        const search = query(req, 'search') ?? '';
        return ok(MEASURES.filter((m) => !search || matches(`${m.code} ${m.description}`, search)));
      }),
  },
  {
    method: 'GET',
    path: /^\/dropdowns$/,
    handle: (req) => withUser(req, () => ok(buildDropdowns(req))),
  },
  {
    method: 'GET',
    path: /^\/activities\/details$/,
    handle: (req) =>
      withUser(req, () => {
        const rows = filterActivities(req);
        if (query(req, 'export') === 'csv') {
          const header = 'Last Update,Activity,Sectoral Body,Status,Activity Type,Frequency';
          const lines = rows.map((a) =>
            [a.lastUpdate, a.activity, a.sectoralBody, a.status, a.activityType, a.frequency]
              .map(csvCell)
              .join(','),
          );
          return raw(new Blob([[header, ...lines].join('\n')], { type: 'text/csv' }), {
            'Content-Type': 'text/csv; charset=utf-8',
          });
        }
        const limit = Number(query(req, 'limit') ?? 10) || 10;
        const paged = paginate(rows, Number(query(req, 'page') ?? 1) || 1, limit);
        const showingFrom = paged.total ? (paged.current_page - 1) * limit + 1 : 0;
        const body: ActivityDetailsResponse = {
          filters: {
            period: numbers(req, 'period'),
            activityType: numbers(req, 'activityType'),
            frequency: numbers(req, 'frequency'),
            status: numbers(req, 'status'),
            sectoralBody: numbers(req, 'sectoralBody'),
            objective: query(req, 'objective'),
            strategicMeasure: query(req, 'strategicMeasure'),
            year: null,
          },
          pagination: {
            page: paged.current_page,
            limit,
            total: paged.total,
            totalPages: paged.last_page,
            showingFrom,
            showingTo: showingFrom ? showingFrom + paged.items.length - 1 : 0,
          },
          items: paged.items.map(toRow),
        };
        return ok(body);
      }),
  },
  {
    method: 'GET',
    path: /^\/activities\/(\d+)\/export$/,
    handle: (req, params) =>
      withUser(req, () => {
        const activity = findActivity(params[1]);
        if (!activity) return fail(req, 404, 'Activity not found.');
        const pdf = `%PDF-1.4\n% Mock export of activity ${activity.id}: ${activity.activity}\n%%EOF`;
        return raw(new Blob([pdf], { type: 'application/pdf' }), {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Activity_${activity.id}.pdf"`,
        });
      }),
  },
  {
    method: 'GET',
    path: /^\/activities\/(\d+)$/,
    handle: (req, params) =>
      withUser(req, () => {
        const activity = findActivity(params[1]);
        return activity ? ok(toDetail(activity)) : fail(req, 404, 'Activity not found.');
      }),
  },
];
