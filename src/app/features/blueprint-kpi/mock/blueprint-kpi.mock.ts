import { fail, type MockRoute, ok, query, raw, withUser } from '@core/mock-api/mock-utils';

import type { DeepAnalysis, DeepAnalysisUpdateRequest } from '../models/blueprint-kpi.models';
import { createKpiDb, toSummary } from './blueprint-kpi.mock-data';

/** In-memory DB — PUTs persist until the page reloads. */
const db = createKpiDb();

function timestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Mock API endpoints for ASCC Strategic Plan KPIs (Tool 3). */
export const BLUEPRINT_KPI_MOCK_ROUTES: MockRoute[] = [
  {
    method: 'GET',
    path: /^\/dashboard\/banner$/,
    // Only the kpi group lives here; other groups fall through to their own feature's mock.
    handle: (req) =>
      query(req, 'group') === 'kpi' ? ok(db.banner) : fail(req, 404, 'Banner not found.'),
  },
  {
    method: 'GET',
    path: /^\/strategic-goals$/,
    handle: () => ok(db.goals.map(toSummary)),
  },
  {
    method: 'GET',
    path: /^\/strategic-goals\/(\d+)$/,
    handle: (req, params) => {
      const goal = db.goals.find((g) => g.id === Number(params[1]));
      return goal ? ok(goal) : fail(req, 404, 'Strategic goal not found.');
    },
  },
  {
    // {id} = deep analysis id
    method: 'GET',
    path: /^\/strategic-measures\/kpi\/(\d+)\/deep-analysis$/,
    handle: (req, params) => {
      const record = db.deepAnalyses.find((d) => d.id === Number(params[1]));
      return record ? ok(record) : fail(req, 404, 'Deep analysis not found.');
    },
  },
  {
    // {id} = STRATEGIC MEASURE id; body.id = deep analysis id. Replaces the record.
    method: 'PUT',
    path: /^\/strategic-measures\/kpi\/(\d+)\/deep-analysis$/,
    handle: (req, params) =>
      withUser(req, (user) => {
        const body = req.body as DeepAnalysisUpdateRequest;
        const index = db.deepAnalyses.findIndex(
          (d) => d.id === body.id && d.strategicMeasure.id === Number(params[1]),
        );
        const current = db.deepAnalyses[index];
        if (!current) return fail(req, 404, 'Deep analysis not found for this strategic measure.');
        const now = new Date().toISOString();
        const stamp = (entries: DeepAnalysisUpdateRequest['amdComments']) =>
          entries.map((e) => (e.at ? e : { ...e, by: user.name, at: now }));
        const updated: DeepAnalysis = {
          ...current,
          leadOrCoLeadSb: body.leadOrCoLeadSb,
          dataSourceStatus: body.dataSourceStatus,
          smDescription: body.smDescription,
          operationalDefinition: body.operationalDefinition,
          identifiedDataSource: body.identifiedDataSource,
          progress: body.progress,
          documentRequests: stamp(body.documentRequests),
          amdComments: stamp(body.amdComments),
          updatedBy: { id: user.id, name: user.name, email: user.email },
          updatedAt: now,
        };
        db.deepAnalyses[index] = updated;
        // smDescription lives on the Strategic Measure → every KPI under it changes.
        db.deepAnalyses = db.deepAnalyses.map((d) =>
          d.strategicMeasure.id === current.strategicMeasure.id
            ? { ...d, smDescription: body.smDescription }
            : d,
        );
        return ok(db.deepAnalyses[index]);
      }),
  },
  {
    // {id} = STRATEGIC MEASURE id
    method: 'GET',
    path: /^\/strategic-measures\/kpi\/(\d+)\/download$/,
    handle: (req, params) => {
      const record = db.deepAnalyses.find((d) => d.strategicMeasure.id === Number(params[1]));
      if (!record) return fail(req, 404, 'No deep analysis recorded for this strategic measure.');
      const code = record.strategicMeasure.code;
      const pdf = new Blob([`%PDF-1.4\n% Mock deep analysis for SM ${code}\n%%EOF\n`], {
        type: 'application/pdf',
      });
      return raw(pdf, {
        'Content-Disposition': `attachment; filename="sm-${code}-deep-analysis-${timestamp(new Date())}.pdf"`,
      });
    },
  },
];
