import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { map, type Observable } from 'rxjs';

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Red confirm button for destructive actions (delete, reject, discard). */
  readonly destructive?: boolean;
}

// CONCEPT: Angular Material dialog + data injection | REACT: components/ui/ConfirmDialog.tsx (portal + local open state) | INTERVIEW: MatDialog renders into a CDK overlay (focus trap, Esc to close, aria-modal) and passes data via the MAT_DIALOG_DATA token.
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="text-sm text-[#5A6B85]">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelLabel ?? 'Cancel' }}</button>
      <button
        mat-flat-button
        [class.confirm-destructive]="data.destructive"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    /* Safe Material override: set the component's documented CSS custom property
       (a "design token") instead of ::ng-deep into its internals. */
    .confirm-destructive {
      --mat-button-filled-container-color: #c73535;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

/** `confirm.ask({...}).subscribe(ok => …)` — emits true only if the user confirmed. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  ask(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
