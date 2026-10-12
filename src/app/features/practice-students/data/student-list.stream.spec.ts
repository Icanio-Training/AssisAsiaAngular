import { type Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import type { Page, Student, StudentQuery } from '../models/student.model';
import { studentListState$, type StudentListSources } from './student-list.stream';

// CONCEPT: marble testing with TestScheduler | REACT: n/a (jest fake timers + act()) | INTERVIEW: a marble string draws a stream on a virtual timeline — each character is 1 ms ("frame"), letters are values, "|" completes, "#" errors, "100ms" skips time. Inside run(), debounceTime/timer use VIRTUAL time, so a 300 ms debounce runs instantly and deterministically.
//   hot('10ms a')          → emits "a" at frame 10
//   cold('500ms (r|)')     → 500 ms after subscription emits "r" and completes in the same frame
//   expectObservable(x).toBe('a 309ms b', values) → asserts WHAT is emitted and WHEN
describe('studentListState$ (RxJS search pipeline)', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  const page = (search: string): Page<Student> => ({
    items: [],
    current_page: 1,
    per_page: 10,
    total: search.length, // encode the search in the result so we can tell responses apart
    last_page: 1,
  });

  function sources(search$: Observable<string>): StudentListSources {
    return {
      search$,
      courses$: of([]),
      sort$: of({ active: 'lastName', direction: 'asc' }),
      page$: of({ pageIndex: 0, pageSize: 10 }),
      refresh$: of(undefined),
    };
  }

  it('debounces typing: only the last value after a 300 ms pause is sent to the API', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const calls: string[] = [];
      const search$ = hot<string>('10ms a 50ms b 50ms c', { a: 'a', b: 'ab', c: 'abc' });
      const load = (q: StudentQuery) => {
        calls.push(q.search);
        return cold('(r|)', { r: page(q.search) });
      };

      studentListState$(sources(search$), load).subscribe();
      flush();

      // '' = the initial load (startWith); 'a' and 'ab' were swallowed by debounceTime.
      expect(calls).toEqual(['', 'abc']);
    });
  });

  it('switchMap cancels the stale request: a slow old response never reaches the table', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const search$ = hot<string>('10ms x', { x: 'xyz' });
      // Every request takes 500 ms. The initial '' request (frame 0) would answer at 500,
      // but the debounced "xyz" arrives at 310 → switchMap unsubscribes from the '' request.
      const load = (q: StudentQuery) => cold('500ms (r|)', { r: page(q.search) });

      const loading = { loading: true, data: null, error: null };
      const done = { loading: false, data: page('xyz'), error: null };

      expectObservable(studentListState$(sources(search$), load)).toBe('l 309ms l 499ms d', {
        l: loading,
        d: done,
      });
    });
  });

  it('turns an API error into an error state instead of killing the stream', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const load = () => cold<Page<Student>>('10ms #', undefined, new Error('boom'));
      expectObservable(studentListState$(sources(of()), load)).toBe('l 9ms e', {
        l: { loading: true, data: null, error: null },
        e: { loading: false, data: null, error: 'Could not load students.' },
      });
    });
  });
});
