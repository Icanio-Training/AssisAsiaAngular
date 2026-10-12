import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { Page, Student, StudentInput } from '../models/student.model';
import { StudentsService } from './students.service';

// CONCEPT: HttpTestingController | REACT: msw / jest.mock('axios') | INTERVIEW: provideHttpClientTesting() swaps the real backend for a fake one — expectOne() asserts the request (URL, method, params, body) and flush() sends a fake response.
describe('StudentsService', () => {
  let service: StudentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StudentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // fails if a request was not expected/flushed

  it('GETs a page of students with search, course[] and paging params', () => {
    const page: Page<Student> = { items: [], current_page: 2, per_page: 5, total: 0, last_page: 1 };
    let result: Page<Student> | undefined;

    service
      .list({
        search: 'ann',
        course: ['Design', 'Business'],
        sort: 'lastName',
        dir: 'asc',
        page: 2,
        per_page: 5,
      })
      .subscribe((res) => (result = res));

    const req = http.expectOne((r) => r.url === 'students');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('ann');
    expect(req.request.params.getAll('course[]')).toEqual(['Design', 'Business']);
    expect(req.request.params.get('sort')).toBe('lastName');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('5');
    req.flush(page);

    expect(result).toEqual(page);
  });

  it('POSTs a new student', () => {
    const body: StudentInput = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@uni.test',
      course: 'Computer Science',
      enrolledOn: '2024-09-01',
      dateOfBirth: '2004-12-10',
      status: 'active',
      subjects: [{ name: 'Algorithms', grade: 95 }],
      notes: '',
    };
    let created: Student | undefined;

    service.create(body).subscribe((s) => (created = s));

    const req = http.expectOne('students');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 99, ...body }, { status: 201, statusText: 'Created' });

    expect(created?.id).toBe(99);
  });

  it('DELETEs a student by id', () => {
    let done = false;
    service.remove(7).subscribe(() => (done = true));

    const req = http.expectOne('students/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(done).toBe(true);
  });

  it('caches the course list with shareReplay (one request for two subscribers)', () => {
    const seen: string[][] = [];
    service.courses$.subscribe((c) => seen.push(c));
    http.expectOne('students/courses').flush(['Design']);
    service.courses$.subscribe((c) => seen.push(c));

    http.expectNone('students/courses');
    expect(seen).toEqual([['Design'], ['Design']]);
  });
});
