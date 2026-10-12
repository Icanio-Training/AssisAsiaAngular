import { type CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  type FormControl,
  type FormGroup,
  type FormGroupDirective,
  type NgForm,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { type ErrorStateMatcher } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, exhaustMap, finalize, type Observable, Subject } from 'rxjs';

import { NotificationService } from '@core/notify/notification.service';
import type { HasUnsavedChanges } from '@shared/guards/unsaved-changes.guard';

import { StudentsService } from '../data/students.service';
import {
  emailAvailableValidator,
  enrolmentAgeValidator,
  noDigitsValidator,
} from '../forms/student.validators';
import { SubjectCatalog } from '../forms/subject-catalog.service';
import {
  type Course,
  COURSES,
  fromIsoDate,
  type Student,
  type StudentInput,
  type StudentStatus,
  toIsoDate,
  type ValidationErrorBody,
} from '../models/student.model';

/** One row of the subjects FormArray. */
type SubjectForm = FormGroup<{
  name: FormControl<string>;
  grade: FormControl<number | null>;
}>;

// CONCEPT: ErrorStateMatcher | REACT: n/a (you decide when to show errors yourself) | INTERVIEW: <mat-error> only shows when its control is invalid AND touched; a custom matcher lets a GROUP error (cross-field) light up a field too.
class EnrolmentErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const groupError =
      !!control?.parent?.hasError('enrolledBeforeBirth') || !!control?.parent?.hasError('tooYoung');
    return !!control && (control.invalid || groupError) && (control.touched || !!form?.submitted);
  }
}

// CONCEPT: typed reactive form (NonNullableFormBuilder) | REACT: react-hook-form useForm<Student>() + zod schema | INTERVIEW: the form model lives in TypeScript, so `form.value.email` is typed string, validators are plain functions, and the whole thing is unit-testable without a template. NonNullable → reset() goes back to the initial value, not null.
@Component({
  selector: 'app-student-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
  ],
  // Component-level provider: a fresh SubjectCatalog for every StudentFormPage instance.
  providers: [SubjectCatalog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-form.page.html',
  styleUrl: './student-form.page.css',
})
export class StudentFormPage implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly studentsApi = inject(StudentsService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly catalog = inject(SubjectCatalog);

  // CONCEPT: route params as inputs (withComponentInputBinding) | REACT: const { id } = useParams() | INTERVIEW: GOTCHA — on a routed component EVERY input() is filled from params/query/data, and a key that isn't there becomes undefined. So declare only real params, and derive defaults with computed().
  // OLD: constructor(private route: ActivatedRoute) {} … this.route.snapshot.paramMap.get('id')
  /** ":id" on /:id/edit — undefined on /new. */
  readonly id = input<string>();
  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly studentId = computed(() => Number(this.id() ?? 0));

  protected readonly courses = COURSES;
  protected readonly enrolmentMatcher = new EnrolmentErrorMatcher();
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveClicks = signal(0);
  protected readonly requestsSent = signal(0);

  /** The email loaded for edit — the async validator skips it ("your own email is fine"). */
  private originalEmail: string | null = null;
  private saved = false;

  protected readonly form = this.fb.group(
    {
      // Built-in validators + our custom noDigitsValidator.
      firstName: ['', [Validators.required, Validators.minLength(2), noDigitsValidator]],
      // Validators.pattern: the same "letters only" idea, done with a regex.
      lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z' -]+$/)]],
      email: this.fb.control('', {
        validators: [Validators.required, Validators.email],
        asyncValidators: [emailAvailableValidator(this.studentsApi, () => this.originalEmail)],
      }),
      course: this.fb.control<Course | ''>('', Validators.required),
      dateOfBirth: this.fb.control<Date | null>(null, Validators.required),
      enrolledOn: this.fb.control<Date | null>(null, Validators.required),
      status: this.fb.control<StudentStatus>('active'),
      subjects: this.fb.array<SubjectForm>([]),
      notes: ['', Validators.maxLength(500)],
    },
    // Cross-field validator lives on the GROUP.
    { validators: enrolmentAgeValidator(16) },
  );

  // CONCEPT: FormArray | REACT: useFieldArray() from react-hook-form | INTERVIEW: a FormArray is a dynamic list of controls/groups — push()/removeAt()/insert() add and remove rows at runtime.
  protected get subjects() {
    return this.form.controls.subjects;
  }

  private readonly save$ = new Subject<StudentInput>();

  constructor() {
    // CONCEPT: exhaustMap (ignore clicks while a save is in flight) | REACT: `if (mutation.isPending) return` / disabled button | INTERVIEW: exhaustMap ignores new values until the current inner observable completes — perfect for Save/Login buttons. (switchMap would CANCEL the first save; concatMap would queue a duplicate.)
    this.save$
      .pipe(
        exhaustMap((body) => {
          this.saving.set(true);
          this.requestsSent.update((n) => n + 1);
          return this.request(body).pipe(
            catchError((err: unknown) => {
              this.applyServerErrors(err);
              return EMPTY; // swallow → the save$ stream stays alive for the next attempt
            }),
            finalize(() => this.saving.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((student) => {
        this.saved = true;
        this.form.markAsPristine();
        this.notify.success(`${student.firstName} ${student.lastName} saved.`);
        void this.router.navigate(['..', student.id], { relativeTo: this.route });
      });
  }

  ngOnInit(): void {
    // Inputs from the router are set before ngOnInit, so the id is available here.
    if (!this.isEdit()) {
      this.addSubject();
      return;
    }
    this.loading.set(true);
    this.studentsApi
      .get(this.studentId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((student) => this.fillForm(student));
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  protected addSubject(name = '', grade: number | null = null): void {
    this.subjects.push(this.newSubjectRow(name, grade));
  }

  protected removeSubject(index: number): void {
    this.subjects.removeAt(index);
    this.form.markAsDirty();
  }

  // CONCEPT: CDK drag-drop | REACT: dnd-kit / react-beautiful-dnd | INTERVIEW: cdkDropList emits (cdkDropListDropped) with previousIndex/currentIndex; YOU reorder the data (moveItemInArray) — the CDK only animates.
  protected dropSubject(event: CdkDragDrop<SubjectForm[]>): void {
    moveItemInArray(this.subjects.controls, event.previousIndex, event.currentIndex);
    this.subjects.updateValueAndValidity(); // recompute subjects.value in the new order
    this.form.markAsDirty();
  }

  protected submit(): void {
    this.saveClicks.update((n) => n + 1);
    // Show every error message at once (mat-error appears only on touched controls).
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending) {
      this.notify.info('Please fix the highlighted fields.');
      return;
    }
    this.save$.next(this.toInput());
  }

  /** getRawValue() includes disabled controls and is fully typed. */
  private toInput(): StudentInput {
    const v = this.form.getRawValue();
    v.subjects.forEach((s) => this.catalog.remember(s.name));
    return {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      course: v.course || 'Computer Science',
      dateOfBirth: v.dateOfBirth ? toIsoDate(v.dateOfBirth) : '',
      enrolledOn: v.enrolledOn ? toIsoDate(v.enrolledOn) : '',
      status: v.status,
      subjects: v.subjects.map((s) => ({ name: s.name.trim(), grade: s.grade ?? 0 })),
      notes: v.notes,
    };
  }

  /** POST for new, PUT for edit. */
  private request(body: StudentInput): Observable<Student> {
    return this.isEdit()
      ? this.studentsApi.update(this.studentId(), body)
      : this.studentsApi.create(body);
  }

  private fillForm(student: Student): void {
    this.originalEmail = student.email;
    // A FormArray only patches rows that already EXIST — so rebuild the rows first.
    this.subjects.clear();
    student.subjects.forEach((s) => this.addSubject(s.name, s.grade));

    // CONCEPT: patchValue vs setValue | REACT: reset(values) in react-hook-form | INTERVIEW: setValue() needs EVERY control (throws if one is missing); patchValue() updates only the keys you pass and ignores extras — ideal for API data that doesn't match the form 1:1.
    this.form.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      course: student.course,
      dateOfBirth: fromIsoDate(student.dateOfBirth),
      enrolledOn: fromIsoDate(student.enrolledOn),
      status: student.status,
      notes: student.notes,
    });
    this.form.markAsPristine(); // loading data is not an "unsaved change"
  }

  /** Laravel 422 `{ errors: { email: ['…'] } }` → control.setErrors({ server: '…' }). */
  private applyServerErrors(err: unknown): void {
    if (!(err instanceof HttpErrorResponse) || err.status !== 422) return;
    const body = err.error as ValidationErrorBody | null;
    for (const [field, messages] of Object.entries(body?.errors ?? {})) {
      const control = this.form.get(field);
      if (!control) continue;
      control.setErrors({ ...control.errors, server: messages[0] ?? 'Invalid value.' });
      control.markAsTouched();
    }
  }

  private newSubjectRow(name: string, grade: number | null): SubjectForm {
    return this.fb.group({
      name: [name, Validators.required],
      grade: this.fb.control<number | null>(grade, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
    });
  }
}
