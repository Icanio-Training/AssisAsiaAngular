import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, filter, Subject, switchMap } from 'rxjs';

import { NotificationService } from '@core/notify/notification.service';
import { CanDirective } from '@core/rbac/can.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { ConfirmService } from '@shared/ui/confirm-dialog';
import { EmptyState, ErrorState } from '@shared/ui/empty-state';

import { type PageState, type SortState, studentListState$ } from '../data/student-list.stream';
import { StudentsService } from '../data/students.service';
import type { Course, Student, StudentSortKey } from '../models/student.model';

const SORT_KEYS: readonly StudentSortKey[] = ['lastName', 'email', 'course', 'enrolledOn'];

// CONCEPT: server-side Material table (MatSort + MatPaginator emit events, the API does the work) | REACT: TanStack Table with manualSorting/manualPagination + useQuery | INTERVIEW: with thousands of rows you don't use MatTableDataSource's client-side sort/paginate — you send sort/page to the API and render only the returned page.
@Component({
  selector: 'app-student-list-page',
  imports: [
    AsyncPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CanDirective,
    InitialsPipe,
    EmptyState,
    ErrorState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-list.page.html',
  styleUrl: './student-list.page.css',
})
export class StudentListPage {
  private readonly studentsApi = inject(StudentsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns = ['name', 'email', 'course', 'enrolledOn', 'status', 'actions'];
  protected readonly pageSizeOptions = [5, 10, 25];

  // Template-driven form state: [(ngModel)] can bind straight to a writable signal.
  protected readonly searchText = signal('');
  protected readonly selectedCourses = signal<Course[]>([]);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  // CONCEPT: toSignal (Observable → Signal) | REACT: const { data = [] } = useQuery(...) | INTERVIEW: toSignal subscribes immediately and unsubscribes automatically when the component is destroyed; give it an initialValue so the signal is never undefined.
  protected readonly courseOptions = toSignal(this.studentsApi.courses$, { initialValue: [] });

  // The "inputs" of the table pipeline. Subject = events only; BehaviorSubject = has a current value.
  private readonly search$ = new Subject<string>();
  private readonly courses$ = new BehaviorSubject<readonly Course[]>([]);
  private readonly sort$ = new BehaviorSubject<SortState>({ active: 'lastName', direction: 'asc' });
  private readonly page$ = new BehaviorSubject<PageState>({ pageIndex: 0, pageSize: 10 });
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  // CONCEPT: async pipe | REACT: n/a (hooks unwrap values for you) | INTERVIEW: `obs$ | async` subscribes when the view renders, unsubscribes on destroy, and marks an OnPush view for check on every emission — no manual subscribe/unsubscribe.
  // OLD: <div *ngIf="state$ | async as state">   (new: @if (state$ | async; as state) { … })
  protected readonly state$ = studentListState$(
    {
      search$: this.search$,
      courses$: this.courses$,
      sort$: this.sort$,
      page$: this.page$,
      refresh$: this.refresh$,
    },
    (query) => this.studentsApi.list(query),
  );

  /** Only push valid searches (empty, or ≥ 2 characters — the template-driven `minlength`). */
  protected onSearch(text: string, valid: boolean | null): void {
    if (!valid) return;
    this.goToFirstPage();
    this.search$.next(text);
  }

  protected onCoursesChange(courses: Course[]): void {
    this.goToFirstPage();
    this.courses$.next(courses);
  }

  protected onSort(sort: Sort): void {
    const active = SORT_KEYS.find((key) => key === sort.active) ?? '';
    this.goToFirstPage();
    this.sort$.next({ active, direction: sort.direction });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.page$.next({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected deleteStudent(student: Student): void {
    // OLD: this.confirm.ask(...).subscribe(...) + ngOnDestroy() { this.destroy$.next() } with takeUntil(destroy$)
    this.confirm
      .ask({
        title: 'Delete student?',
        message: `${student.firstName} ${student.lastName} will be removed permanently.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
      .pipe(
        filter(Boolean), // only continue when the user clicked "Delete"
        switchMap(() => this.studentsApi.remove(student.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notify.success(`Deleted ${student.firstName} ${student.lastName}.`);
        this.reload(); // errors are shown by the global error-toast interceptor
      });
  }

  private goToFirstPage(): void {
    if (this.pageIndex() === 0) return;
    this.pageIndex.set(0);
    this.page$.next({ pageIndex: 0, pageSize: this.pageSize() });
  }
}
