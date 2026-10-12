import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

// CONCEPT: wrapping a library behind an app service | REACT: `toast.success()` / `toast.error()` from sonner | INTERVIEW: components depend on NotificationService, not MatSnackBar — swap the library in one place and mock it easily in tests.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500, panelClass: 'snack-success' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 6000, panelClass: 'snack-error' });
  }

  info(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
  }
}
