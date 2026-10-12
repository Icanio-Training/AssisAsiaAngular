import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { ROUTES } from '@core/constants/routes';

/**
 * `/callback?code=…&state=…` — the PKCE redirect target (was routes/callback.tsx
 * + useAuthCallback).
 *
 * Query params arrive as signal inputs thanks to `withComponentInputBinding()`
 * in app.config.ts — the replacement for TanStack's `validateSearch` + `Route.useSearch()`.
 * `ngOnInit` runs exactly once, so the React `ranOnce` ref guard isn't needed.
 */
@Component({
  selector: 'app-callback-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 flex items-center justify-center bg-white">
      @if (status() === 'error') {
        <div class="max-w-sm text-center">
          <h1 class="mb-2 text-lg font-bold text-[#141A28]">Sign-in failed</h1>
          <p class="mb-5 text-sm text-[#5A6B85]">We couldn't complete sign-in. Please try again.</p>
          <a
            [routerLink]="routes.LOGIN"
            class="text-sm font-semibold text-primary-600 hover:underline"
          >
            Back to sign in
          </a>
        </div>
      } @else {
        <p class="text-sm text-[#5A6B85]">Signing you in…</p>
      }
    </div>
  `,
})
export class CallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly code = input<string>();
  readonly state = input<string>();
  readonly error = input<string>();

  protected readonly routes = ROUTES;
  protected readonly status = signal<'exchanging' | 'error'>('exchanging');

  ngOnInit(): void {
    const code = this.code();
    if (this.error() || !code) {
      this.status.set('error');
      return;
    }

    this.auth
      .completeAuthorization(code, this.state() ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this.status.set('error') });
  }
}
