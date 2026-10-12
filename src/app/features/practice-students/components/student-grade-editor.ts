import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { GradeLetterPipe } from '../pipes/grade-letter.pipe';

// CONCEPT: component communication — input() / output() / model() | REACT: props in, callback props out (onCommit), and a controlled value + onChange pair | INTERVIEW: input() = parent → child, output() = child → parent event, model() = BOTH in one: the parent writes [(grade)]="signal" and the child can .set() it.
// OLD: @Input() subject!: string;  @Output() committed = new EventEmitter<number>();
// OLD (two-way): @Input() grade = 0; @Output() gradeChange = new EventEmitter<number>();  — model() creates exactly this pair.
@Component({
  selector: 'app-student-grade-editor',
  imports: [MatButtonModule, MatIconModule, GradeLetterPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-medium">{{ subject() }}:</span>
      <button
        mat-icon-button
        type="button"
        [attr.aria-label]="'Decrease ' + subject() + ' grade by ' + step()"
        (click)="change(-step())"
      >
        <mat-icon fontSet="material-symbols-outlined">remove</mat-icon>
      </button>
      <output class="w-20 text-center" aria-live="polite">
        {{ grade() }} ({{ grade() | gradeLetter }})
      </output>
      <button
        mat-icon-button
        type="button"
        [attr.aria-label]="'Increase ' + subject() + ' grade by ' + step()"
        (click)="change(step())"
      >
        <mat-icon fontSet="material-symbols-outlined">add</mat-icon>
      </button>
      <button mat-stroked-button type="button" (click)="committed.emit(grade())">Commit</button>
    </div>
  `,
})
export class StudentGradeEditor {
  /** Required input — the parent MUST pass it (compile error otherwise). */
  readonly subject = input.required<string>();
  /** Optional input with a default. */
  readonly step = input(5);
  /** Two-way: parent uses [(grade)]="someSignal". */
  readonly grade = model.required<number>();
  /** Event to the parent: (committed)="onCommitted($event)". */
  readonly committed = output<number>();

  protected change(delta: number): void {
    // Writing a model() updates the parent's signal too.
    this.grade.update((g) => Math.min(100, Math.max(0, g + delta)));
  }

  /** Public method — the parent calls it through viewChild(). */
  reset(): void {
    this.grade.set(50);
  }
}
