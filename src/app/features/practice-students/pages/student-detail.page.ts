import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  JsonPipe,
  NgClass,
  NgStyle,
  PercentPipe,
  SlicePipe,
  TitleCasePipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';

import { NotificationService } from '@core/notify/notification.service';

import { LifecycleLogger } from '../components/lifecycle-logger';
import { StudentGradeEditor } from '../components/student-grade-editor';
import { StudentsService } from '../data/students.service';
import type { Course, Student } from '../models/student.model';
import { GradeLetterPipe } from '../pipes/grade-letter.pipe';

export interface ActivityEntry {
  id: number;
  at: Date;
  text: string;
}

const TUITION_BY_COURSE: Record<Course, number> = {
  'Computer Science': 9250,
  Business: 8400,
  Engineering: 9800,
  Design: 7900,
};

const ACTIONS = [
  'Logged in',
  'Submitted assignment',
  'Viewed timetable',
  'Downloaded notes',
  'Joined lecture',
];

/** ~1,000 fake log lines — enough that rendering them all at once would be slow. */
function buildActivityLog(student: Student, count = 1000): ActivityEntry[] {
  const start = new Date(`${student.enrolledOn}T09:00:00`).getTime();
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    at: new Date(start + i * 6 * 60 * 60 * 1000),
    text: `${ACTIONS[(i + student.id) % ACTIONS.length] ?? 'Activity'} (#${i + 1})`,
  }));
}

// CONCEPT: Angular sanitization of [innerHTML] | REACT: dangerouslySetInnerHTML (NO sanitizing — you'd add DOMPurify) | INTERVIEW: Angular treats every bound value as untrusted; for [innerHTML] it keeps safe tags (<b>, <img src>) and STRIPS script-y parts like onerror="…" and <script>, logging "sanitizing HTML stripped some content" in dev.
// The dangerous opt-out is DomSanitizer.bypassSecurityTrustHtml(html) — only for HTML you fully control, never for user input.
// Student #1's notes contain `<img src=x onerror=alert(1)>` — open it: no alert, the handler is gone.
@Component({
  selector: 'app-student-detail-page',
  imports: [
    RouterLink,
    ScrollingModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    DatePipe,
    TitleCasePipe,
    PercentPipe,
    DecimalPipe,
    CurrencyPipe,
    SlicePipe,
    JsonPipe,
    NgClass,
    NgStyle,
    GradeLetterPipe,
    StudentGradeEditor,
    LifecycleLogger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-detail.page.html',
  styleUrl: './student-detail.page.css',
})
export class StudentDetailPage {
  private readonly studentsApi = inject(StudentsService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Filled by the router from `resolve: { student: studentResolver }` (withComponentInputBinding). */
  readonly student = input.required<Student>();

  // CONCEPT: linkedSignal | REACT: useState(prop) + useEffect to reset it when the prop changes | INTERVIEW: a writable signal that RESETS whenever its source changes — local edits (PATCH result) on top of the resolved input.
  protected readonly current = linkedSignal(() => this.student());

  protected readonly fullName = computed(
    () => `${this.current().firstName} ${this.current().lastName}`,
  );
  protected readonly average = computed(() => {
    const grades = this.current().subjects.map((s) => s.grade);
    return grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
  });
  protected readonly tuition = computed(() => TUITION_BY_COURSE[this.current().course]);
  protected readonly activity = computed(() => buildActivityLog(this.current()));

  protected readonly showDebug = signal(false);
  protected readonly togglingStatus = signal(false);

  // --- Component communication demo ---
  protected readonly demoGrade = signal(70); // two-way bound with [(grade)]
  protected readonly lastCommitted = signal<number | null>(null);

  // CONCEPT: viewChild() signal query | REACT: useRef + forwardRef/useImperativeHandle | INTERVIEW: viewChild() gives the parent a signal of the child COMPONENT INSTANCE (or element) from its own template — available after the view is created.
  // OLD: @ViewChild(StudentGradeEditor) editor!: StudentGradeEditor;  (read in ngAfterViewInit)
  private readonly gradeEditor = viewChild(StudentGradeEditor);

  // --- Lifecycle demo ---
  protected readonly showLogger = signal(true);
  protected readonly loggerLabel = signal('Alpha');

  protected resetEditor(): void {
    this.gradeEditor()?.reset();
  }

  protected renameLogger(): void {
    this.loggerLabel.update((label) => (label === 'Alpha' ? 'Beta' : 'Alpha'));
  }

  /** PATCH — change one field without sending the whole record. */
  protected toggleStatus(): void {
    const student = this.current();
    this.togglingStatus.set(true);
    this.studentsApi
      .setStatus(student.id, student.status === 'active' ? 'inactive' : 'active')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.current.set(updated);
          this.togglingStatus.set(false);
          this.notify.success(`Status changed to ${updated.status}.`);
        },
        error: () => this.togglingStatus.set(false),
      });
  }
}
