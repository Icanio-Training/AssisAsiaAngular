import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  type Observable,
  of,
  scan,
  startWith,
  switchMap,
} from 'rxjs';

import { apiErrorMessage } from '@shared/utils/download';

import type {
  Course,
  Page,
  SortDirection,
  Student,
  StudentQuery,
  StudentSortKey,
} from '../models/student.model';

export interface SortState {
  active: StudentSortKey | '';
  direction: SortDirection;
}

export interface PageState {
  pageIndex: number; // 0-based (MatPaginator) — the API is 1-based
  pageSize: number;
}

/** The inputs of the table: every one is a stream of "what the user picked". */
export interface StudentListSources {
  search$: Observable<string>;
  courses$: Observable<readonly Course[]>;
  sort$: Observable<SortState>;
  page$: Observable<PageState>;
  /** Emit to re-run the current query (e.g. after a delete). */
  refresh$: Observable<void>;
}

export interface StudentListState {
  loading: boolean;
  data: Page<Student> | null;
  error: string | null;
}

const LOADING: StudentListState = { loading: true, data: null, error: null };

// CONCEPT: declarative RxJS search pipeline | REACT: useState for each filter + useDebounce + useQuery({ queryKey: [search, sort, page] }) | INTERVIEW: combineLatest = "re-run when ANY input changes", debounceTime = wait for typing to pause, switchMap = cancel the stale request so an old response can never overwrite a newer one.
// A plain function (not inside a component) so it can be unit-tested with marble diagrams.
export function studentListState$(
  sources: StudentListSources,
  load: (query: StudentQuery) => Observable<Page<Student>>,
  debounceMs = 300,
): Observable<StudentListState> {
  const search$ = sources.search$.pipe(
    map((text) => text.trim()),
    debounceTime(debounceMs), // wait until the user stops typing for 300 ms
    startWith(''), // …but don't wait for the very first load
    distinctUntilChanged(), // "abc" → "abcd" → "abc" within 300 ms = no new request
  );

  return combineLatest([
    search$,
    sources.courses$,
    sources.sort$,
    sources.page$,
    sources.refresh$,
  ]).pipe(
    map(([search, course, sort, page]): StudentQuery => ({
      search,
      course,
      sort: sort.direction ? sort.active : '',
      dir: sort.direction,
      page: page.pageIndex + 1,
      per_page: page.pageSize,
    })),
    // switchMap unsubscribes from the previous request → HttpClient aborts it.
    switchMap((query) =>
      load(query).pipe(
        map((data): StudentListState => ({ loading: false, data, error: null })),
        // catchError INSIDE switchMap: an error ends only this request, not the whole stream.
        catchError((err: unknown) =>
          of<StudentListState>({
            loading: false,
            data: null,
            error: apiErrorMessage(err, 'Could not load students.'),
          }),
        ),
        startWith(LOADING),
      ),
    ),
    // Keep showing the previous rows while the next page loads (no table flicker).
    scan((prev, next) => (next.loading ? { ...next, data: prev.data } : next), LOADING),
  );
}
