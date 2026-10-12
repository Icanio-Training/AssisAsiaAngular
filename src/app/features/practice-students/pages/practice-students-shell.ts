import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';

// CONCEPT: Material 3 theming with color-scheme | REACT: a ThemeProvider / `dark` class on a wrapper (Tailwind dark mode) | INTERVIEW: `mat.theme()` emits every --mat-sys-* token as light-dark(lightValue, darkValue), so flipping the CSS `color-scheme` on ANY element re-themes the Material components inside it — no second theme, no JS.
// Scoped to THIS feature: only the wrapper below switches to dark. (Dialogs/menus render in the
// CDK overlay container at <body>, outside this wrapper, so they stay light — to theme those too
// you would set color-scheme on <body>.)
//
// CONCEPT: styling Material without ::ng-deep | REACT: n/a | INTERVIEW: ::ng-deep is deprecated and leaks styles into every child component; Material exposes documented CSS custom properties ("tokens", e.g. --mat-toolbar-container-background-color) or Sass `mat.toolbar-overrides()` mixins instead — stable across upgrades.
@Component({
  selector: 'app-practice-students-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="students-scope min-h-full" [class.dark]="dark()">
      <mat-toolbar class="students-toolbar" role="banner">
        <a routerLink="list" class="students-title">Practice: Students CRUD</a>
        <span class="flex-1"></span>
        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="dark() ? 'Switch to light theme' : 'Switch to dark theme'"
          [attr.aria-pressed]="dark()"
          [matTooltip]="dark() ? 'Light theme' : 'Dark theme'"
          (click)="dark.update((d) => !d)"
        >
          <mat-icon fontSet="material-symbols-outlined">{{
            dark() ? 'light_mode' : 'dark_mode'
          }}</mat-icon>
        </button>
      </mat-toolbar>
      <main class="p-4">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .students-scope {
      color-scheme: light;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }
    .students-scope.dark {
      color-scheme: dark; /* every --mat-sys-* token now resolves to its dark value */
    }
    .students-toolbar {
      /* Documented Material token — the safe way to restyle a Material component. */
      --mat-toolbar-container-background-color: var(--mat-sys-primary-container);
      --mat-toolbar-container-text-color: var(--mat-sys-on-primary-container);
    }
    .students-title {
      font: var(--mat-sys-title-large);
      color: inherit;
      text-decoration: none;
    }
  `,
})
export class PracticeStudentsShell {
  protected readonly dark = signal(false);
}
