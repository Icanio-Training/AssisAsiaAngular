import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import type { DeepAnalysis, StrategicGoalDetail } from '../models/blueprint-kpi.models';
import { buildUpdateBody, draftFrom, EMPTY_ENTRIES } from '../utils/deep-analysis';
import { BlueprintKpiService } from './blueprint-kpi.service';

const goal: StrategicGoalDetail = {
  id: 1,
  code: 'SG1',
  label: '1',
  title: 'Strategic Goal 1',
  description: 'A people-centred Community.',
  objectivesCount: 0,
  strategicMeasuresCount: 0,
  objectives: [],
};

const record: DeepAnalysis = {
  id: 2,
  kpiDetailId: 1,
  kpiCode: '1.1.1.1',
  kpiName: 'Increase in broadband access.',
  strategicMeasure: { id: 17, code: '1.1.1', name: '1.1.1' },
  leadOrCoLeadSb: 'SOMRI',
  coLead: null,
  supportingSbs: null,
  dataSourceStatus: null,
  smDescription: 'Enhance mechanisms.',
  operationalDefinition: null,
  identifiedDataSource: null,
  baselineData: null,
  target: null,
  monitoringYear: null,
  monitoringStatus: null,
  progress: [],
  documentRequests: [],
  amdComments: [],
  createdBy: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
};

describe('BlueprintKpiService', () => {
  let service: BlueprintKpiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BlueprintKpiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs /strategic-goals/{goal id} and caches it (one request for two subscribers)', async () => {
    const first = firstValueFrom(service.getStrategicGoal(1));
    const second = firstValueFrom(service.getStrategicGoal(1));
    const req = http.expectOne('strategic-goals/1');
    expect(req.request.method).toBe('GET');
    req.flush(goal);
    expect(await first).toEqual(goal);
    expect(await second).toEqual(goal);
  });

  it('sends GET /dashboard/banner?group=kpi', () => {
    service.banner$.subscribe();
    const req = http.expectOne((r) => r.url === 'dashboard/banner');
    expect(req.request.params.get('group')).toBe('kpi');
    req.flush({ group: 'kpi', title: 't', description: 'd' });
  });

  it('PUTs the full buildUpdateBody to the STRATEGIC MEASURE id', async () => {
    const body = buildUpdateBody(
      record,
      { ...draftFrom(record), dataSourceStatus: '  ' },
      { ...EMPTY_ENTRIES, amdComments: ' New comment ' },
    );
    const result = firstValueFrom(service.updateDeepAnalysis(17, body));
    const req = http.expectOne('strategic-measures/kpi/17/deep-analysis');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    expect(req.request.body.id).toBe(2);
    expect(req.request.body.amdComments).toEqual([{ message: 'New comment' }]);
    req.flush(record);
    expect(await result).toEqual(record);
  });

  it('downloads the PDF as a blob and reads the filename from Content-Disposition', async () => {
    const result = firstValueFrom(service.downloadStrategicMeasurePdf(17, '1.1.1'));
    const req = http.expectOne('strategic-measures/kpi/17/download');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('Accept')).toBe('application/pdf');
    req.flush(new Blob(['%PDF'], { type: 'application/pdf' }), {
      headers: new HttpHeaders({
        'Content-Disposition': 'attachment; filename=sm-1.1.1-deep-analysis-20260926.pdf',
      }),
    });
    expect((await result).filename).toBe('sm-1.1.1-deep-analysis-20260926.pdf');
  });

  it('falls back to a code-based filename', async () => {
    const result = firstValueFrom(service.downloadStrategicMeasurePdf(17, '1.1.1'));
    http.expectOne('strategic-measures/kpi/17/download').flush(new Blob(['%PDF']));
    expect((await result).filename).toBe('sm-1.1.1-deep-analysis.pdf');
  });
});
