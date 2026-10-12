import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '@core/auth/auth.service';
import { ROUTES } from '@core/constants/routes';

// CONCEPT: Reactive Forms | REACT: react-hook-form useForm + zodResolver(loginSchema) | INTERVIEW: the form model lives in the class (FormGroup); the template only binds to it with [formGroup] / formControlName — easy to test without the DOM.
//   {...register('email')}  → formControlName="email"
//   handleSubmit(onSubmit)  → (ngSubmit)="onSubmit()"
//   z.email() / min(1)      → Validators.email / Validators.required
// CONCEPT: takeUntilDestroyed | INTERVIEW: unsubscribes automatically when the component is destroyed — cancels the in-flight HTTP call, no memory leak.
// OLD: implements OnDestroy { private destroy$ = new Subject<void>(); … pipe(takeUntil(this.destroy$)) … ngOnDestroy() { this.destroy$.next(); } }
@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.html',
})
export class LoginForm {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly routes = ROUTES;

  // `NonNullableFormBuilder` → getRawValue() is typed { email: string; password: string }.
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly isPending = signal(false);
  /** A translation KEY (e.g. 'login.errors.email'), translated in the template. */
  protected readonly submitError = signal<string | null>(null);

  protected onSubmit(): void {
    const validationError = this.firstValidationError();
    this.submitError.set(validationError);
    if (validationError) return;

    this.isPending.set(true);
    // Nothing is sent until subscribe() — Observables are lazy.
    this.auth
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.isPending.set(false);
          this.submitError.set(
            error instanceof HttpErrorResponse && error.status === 401
              ? 'login.errors.invalid'
              : 'login.errors.generic',
          );
        },
      });
  }

  private firstValidationError(): string | null {
    const { email, password } = this.form.controls;
    if (email.invalid) return 'login.errors.email';
    if (password.invalid) return 'login.errors.password';
    return null;
  }
}
