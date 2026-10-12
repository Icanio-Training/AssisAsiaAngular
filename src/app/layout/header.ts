import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '@core/auth/auth.service';
import { AuthStore } from '@core/auth/auth.store';
import { DATA_MANAGEMENT_MENUS, DATABASE_LINKS } from '@core/constants/nav';
import { ROUTES } from '@core/constants/routes';
import { LoadingService } from '@core/http/loading.service';
import { type LanguageCode, LanguageService } from '@core/i18n/language.service';
import { RbacService } from '@core/rbac/rbac.service';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

const ROLE_LABELS = {
  public: 'Public',
  guest: 'Guest',
  contributor: 'Contributor',
  content_manager: 'Content Manager',
  admin: 'Admin',
} as const;

// CONCEPT: Angular Material menus (CDK overlay) | REACT: components/layout/Header.tsx — hand-built dropdowns + createPortal + getBoundingClientRect positioning | INTERVIEW: mat-menu renders into an overlay attached to <body>, so it's never clipped, and gives keyboard navigation, focus return and Esc-to-close for free.
// CONCEPT: role-filtered navigation via computed() | REACT: useVisibleNavItems() | INTERVIEW: the visible menu is DERIVED from the role signal — log in as another role and the header updates itself.
@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressBarModule,
    TranslatePipe,
    InitialsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-[700] border-b border-[#E2E9F3] bg-white">
      <div class="flex h-[76px] items-center justify-between gap-6 px-8">
        <a
          [routerLink]="routes.INITIATIVES"
          class="flex shrink-0 items-center"
          aria-label="ADME home"
        >
          <img
            src="assets/adme-logo.svg"
            alt="ADME — ASCC Database for Monitoring and Evaluation System"
            class="h-11 w-auto"
          />
        </a>

        @if (user(); as u) {
          <nav aria-label="Main" class="flex min-w-0 flex-1 items-center justify-center gap-1">
            <button
              type="button"
              class="nav-trigger"
              [matMenuTriggerFor]="databaseMenu"
              [class.nav-active]="isActive('/initiatives', '/outcome-documents', '/blueprint-kpi')"
            >
              {{ 'nav.database' | translate }}
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >expand_more</span
              >
            </button>
            <mat-menu #databaseMenu="matMenu">
              @for (link of databaseLinks(); track link.path) {
                <a mat-menu-item [routerLink]="link.path" routerLinkActive="menu-active">
                  {{ link.i18nKey | translate }}
                </a>
              }
            </mat-menu>

            @if (dataManagementSections().length > 0) {
              <button
                type="button"
                class="nav-trigger"
                [matMenuTriggerFor]="dmMenu"
                [class.nav-active]="isActive('/data-management')"
              >
                {{ 'nav.dataManagement' | translate }}
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                  >expand_more</span
                >
              </button>
              <mat-menu #dmMenu="matMenu">
                @for (
                  section of dataManagementSections();
                  track section.i18nKey;
                  let first = $first
                ) {
                  @if (!first) {
                    <mat-divider />
                  }
                  <div
                    class="px-4 pt-2 pb-1 text-[10px] font-extrabold tracking-[0.06em] text-[#8A9BB5] uppercase"
                  >
                    {{ section.i18nKey | translate }}
                  </div>
                  @for (link of section.links; track link.path) {
                    <a
                      mat-menu-item
                      [routerLink]="link.path"
                      routerLinkActive="menu-active"
                      [routerLinkActiveOptions]="{ exact: true }"
                    >
                      {{ link.i18nKey | translate }}
                    </a>
                  }
                }
              </mat-menu>
            }
          </nav>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="nav-trigger"
              [matMenuTriggerFor]="langMenu"
              [attr.aria-label]="'nav.language' | translate"
            >
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true"
                >translate</span
              >
              <span class="uppercase">{{ language.current() }}</span>
            </button>
            <mat-menu #langMenu="matMenu">
              @for (lang of language.languages; track lang.code) {
                <button mat-menu-item type="button" (click)="setLanguage(lang.code)">
                  {{ lang.label }}
                </button>
              }
            </mat-menu>

            <button
              type="button"
              class="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-[#EEF3FA]"
              [matMenuTriggerFor]="profileMenu"
              aria-label="Account menu"
            >
              <span
                class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white"
                aria-hidden="true"
              >
                {{ u.name | initials }}
              </span>
              <span class="hidden flex-col text-left leading-tight xl:flex">
                <span class="text-sm font-semibold text-[#141A28]">{{ u.name }}</span>
                <span class="text-xs text-[#8A9BB5]">{{ roleLabel() }}</span>
              </span>
            </button>
            <mat-menu #profileMenu="matMenu" xPosition="before">
              <div class="px-4 py-2 text-xs text-[#8A9BB5]">{{ u.email }}</div>
              <mat-divider />
              <a mat-menu-item [routerLink]="routes.PRACTICE_STUDENTS">
                <span
                  class="material-symbols-outlined mr-2 align-middle text-[20px]"
                  aria-hidden="true"
                  >school</span
                >
                {{ 'nav.practice' | translate }}
              </a>
              <button mat-menu-item type="button" (click)="logout()">
                <span
                  class="material-symbols-outlined mr-2 align-middle text-[20px]"
                  aria-hidden="true"
                  >logout</span
                >
                {{ 'nav.logout' | translate }}
              </button>
            </mat-menu>
          </div>
        }
      </div>

      <!-- Global HTTP loading indicator (written by loadingInterceptor, read here). -->
      <div class="absolute right-0 bottom-0 left-0 h-[3px]">
        @if (loading.isLoading()) {
          <mat-progress-bar mode="indeterminate" aria-label="Loading" />
        }
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    header {
      position: sticky;
    }
    .nav-trigger {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 14.5px;
      white-space: nowrap;
      color: #33415c;
      cursor: pointer;
    }
    .nav-trigger:hover {
      background: #eef3fa;
      color: #2c59a7;
    }
    .nav-active {
      font-weight: 700;
      color: #2c59a7;
    }
    .menu-active {
      font-weight: 700;
      color: #2c59a7;
    }
  `,
})
export class Header {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly rbac = inject(RbacService);
  protected readonly loading = inject(LoadingService);
  protected readonly language = inject(LanguageService);

  private readonly router = inject(Router);

  // CONCEPT: toSignal() — RxJS → signal | REACT: useRouterState().location.pathname | INTERVIEW: router.events is an Observable; toSignal subscribes (and unsubscribes on destroy) and exposes the latest URL as a signal.
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly routes = ROUTES;
  protected readonly user = this.authStore.user;
  protected readonly roleLabel = computed(() => ROLE_LABELS[this.authStore.role()]);

  protected readonly databaseLinks = computed(() => {
    this.authStore.role(); // re-compute when the role changes
    return DATABASE_LINKS.filter((link) => !link.capability || this.rbac.can(link.capability));
  });

  protected readonly dataManagementSections = computed(
    () => DATA_MANAGEMENT_MENUS[this.authStore.role()] ?? [],
  );

  protected isActive(...prefixes: string[]): boolean {
    return prefixes.some((p) => this.url().startsWith(p));
  }

  protected setLanguage(code: LanguageCode): void {
    this.language.use(code);
  }

  protected logout(): void {
    this.authService.logout();
  }
}
