import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ROUTES } from '@core/constants/routes';

// CONCEPT: wildcard route ('**') → 404 page | REACT: TanStack notFoundComponent | INTERVIEW: the '**' route must be LAST — the router picks the first match in array order.
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p class="text-6xl font-extrabold text-primary-600">404</p>
      <h1 class="text-2xl font-bold text-[#141A28]">{{ 'common.notFoundTitle' | translate }}</h1>
      <p class="max-w-md text-[#5A6B85]">{{ 'common.notFoundText' | translate }}</p>
      <a mat-flat-button [routerLink]="routes.INITIATIVES">{{ 'common.backHome' | translate }}</a>
    </section>
  `,
})
export class NotFoundPage {
  protected readonly routes = ROUTES;
}
