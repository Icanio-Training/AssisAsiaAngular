import { type HttpContext, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable, shareReplay } from 'rxjs';

import { toHttpParams } from '@core/http/api-params';
import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADING, withFlags } from '@core/http/http-context';

import type {
  Course,
  Page,
  Student,
  StudentInput,
  StudentQuery,
  StudentStatus,
} from '../models/student.model';

// CONCEPT: HttpClient data service | REACT: an api.ts module with axios calls wrapped in useQuery hooks | INTERVIEW: HttpClient returns COLD observables — nothing is sent until someone subscribes, and each subscribe sends a new request.
// The interceptors add /api/v1 + token and unwrap `{ success, data }`, so paths here are relative.
// OLD (constructor DI): constructor(private http: HttpClient) {}
@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly http = inject(HttpClient);

  // CONCEPT: shareReplay cache | REACT: useQuery({ queryKey: ['courses'], staleTime: Infinity }) | INTERVIEW: shareReplay(1) turns the cold request into a shared one — the first subscriber triggers the GET, later subscribers get the cached value without a new request.
  readonly courses$: Observable<Course[]> = this.http
    .get<Course[]>('students/courses')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  /** Server-side search + filter + sort + pagination. */
  list(query: StudentQuery): Observable<Page<Student>> {
    return this.http.get<Page<Student>>('students', {
      params: toHttpParams(query), // course: ['Design'] → course[]=Design
      context: withFlags(SKIP_GLOBAL_LOADING), // the table shows its own spinner
    });
  }

  get(id: number, context?: HttpContext): Observable<Student> {
    return this.http.get<Student>(`students/${id}`, context ? { context } : {});
  }

  create(body: StudentInput): Observable<Student> {
    return this.http.post<Student>('students', body);
  }

  /** PUT = replace the whole record. */
  update(id: number, body: StudentInput): Observable<Student> {
    return this.http.put<Student>(`students/${id}`, body);
  }

  /** PATCH = change only some fields. */
  setStatus(id: number, status: StudentStatus): Observable<Student> {
    return this.http.patch<Student>(`students/${id}`, { status });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<null>(`students/${id}`).pipe(map(() => undefined));
  }

  /** Used by the async validator — quiet: no loading bar, no error toast. */
  isEmailAvailable(email: string): Observable<boolean> {
    return this.http
      .get<{ available: boolean }>('students/email-available', {
        params: toHttpParams({ email }),
        context: withFlags(SKIP_GLOBAL_LOADING, SKIP_ERROR_TOAST),
      })
      .pipe(map((res) => res.available));
  }
}
