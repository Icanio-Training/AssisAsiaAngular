import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './header';
import { SiteFooter } from './site-footer';

/** Layout route component (was routes/_app.tsx + AppLayout.tsx).
    `<router-outlet />` is where child routes render — TanStack's `<Outlet />`. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, SiteFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col bg-white">
      <app-header />
      <main class="flex min-w-0 flex-1 flex-col">
        <router-outlet />
      </main>
      <app-site-footer />
    </div>
  `,
})
export class AppLayout {}
