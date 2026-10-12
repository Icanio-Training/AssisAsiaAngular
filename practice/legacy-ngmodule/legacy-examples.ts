// =============================================================================
// LEGACY ANGULAR (≤ v14 style, still common in client projects) — reference only.
// Not part of the app build; type-checked with:  npx tsc -p practice/legacy-ngmodule
// Each block shows the OLD form and names the MODERN equivalent used in this project.
// =============================================================================
/* eslint-disable */
import { CommonModule } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  type HttpEvent,
  type HttpHandler,
  type HttpInterceptor,
  type HttpRequest,
} from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  NgModule,
  type OnDestroy,
  type OnInit,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import {
  type ActivatedRouteSnapshot,
  type CanActivate,
  Router,
  RouterModule,
  type Routes,
  type UrlTree,
} from '@angular/router';
import { BehaviorSubject, type Observable, Subject, takeUntil } from 'rxjs';

// ---------------------------------------------------------------------------
// 1. Service with a BehaviorSubject store + constructor injection
//    MODERN: core/auth/auth.store.ts (signals) + inject()
// ---------------------------------------------------------------------------
interface LegacyUser {
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class LegacyAuthStore {
  private readonly user$ = new BehaviorSubject<LegacyUser | null>(null);
  readonly user: Observable<LegacyUser | null> = this.user$.asObservable();

  get snapshot(): LegacyUser | null {
    return this.user$.value;
  }

  setUser(user: LegacyUser | null): void {
    this.user$.next(user);
  }
}

// ---------------------------------------------------------------------------
// 2. Component: @Input / @Output + EventEmitter, *ngIf / *ngFor, async pipe,
//    subscribe in ngOnInit + takeUntil(destroy$) in ngOnDestroy, NOT standalone.
//    MODERN: input() / output(), @if / @for (track), toSignal / takeUntilDestroyed, standalone: true (default)
// ---------------------------------------------------------------------------
@Component({
  selector: 'legacy-user-card',
  standalone: false, // declared in an NgModule instead
  template: `
    @if (user) {
      <div class="card">
        <h3>{{ user.name }}</h3>
        <ul>
          @for (tag of tags; track trackByTag($index, tag)) {
            <li>{{ tag }}</li>
          }
        </ul>
        @if (store.user | async; as current) {
          <p>Signed in as {{ current.name }}</p>
        }
        <button (click)="remove.emit(user.name)">Remove</button>
      </div>
    } @else {
      <p>No user</p>
    }
  `,
})
export class LegacyUserCardComponent implements OnInit, OnDestroy {
  @Input() user: LegacyUser | null = null; // MODERN: user = input<LegacyUser | null>(null)
  @Input() tags: string[] = [];
  @Output() remove = new EventEmitter<string>(); // MODERN: remove = output<string>()

  private readonly destroy$ = new Subject<void>();

  // Constructor injection — MODERN: private readonly store = inject(LegacyAuthStore)
  constructor(public store: LegacyAuthStore) {}

  ngOnInit(): void {
    this.store.user.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      console.log('user changed', u);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByTag(_index: number, tag: string): string {
    return tag;
  }
}

// ---------------------------------------------------------------------------
// 3. Class-based guard — MODERN: functional CanActivateFn (core/auth/auth.guard.ts)
// ---------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class LegacyAuthGuard implements CanActivate {
  constructor(
    private store: LegacyAuthStore,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredRole = route.data['role'] as string | undefined;
    const user = this.store.snapshot;
    if (user && (!requiredRole || user.role === requiredRole)) return true;
    return this.router.parseUrl('/login');
  }
}

// ---------------------------------------------------------------------------
// 4. Class-based interceptor + HTTP_INTERCEPTORS multi provider
//    MODERN: HttpInterceptorFn + withInterceptors([...]) (core/http/interceptors.ts)
// ---------------------------------------------------------------------------
@Injectable()
export class LegacyAuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    return next.handle(
      token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req,
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Feature module with lazy loading via loadChildren → NgModule
//    MODERN: loadChildren: () => import('./feature.routes') returning Routes (app.routes.ts)
// ---------------------------------------------------------------------------
const featureRoutes: Routes = [{ path: '', component: LegacyUserCardComponent }];

@NgModule({
  declarations: [LegacyUserCardComponent], // components that BELONG to this module
  imports: [CommonModule, RouterModule.forChild(featureRoutes)], // what its templates use
  exports: [LegacyUserCardComponent], // what other modules may use
})
export class LegacyUsersModule {}

// ---------------------------------------------------------------------------
// 6. Root module — MODERN: bootstrapApplication(App, appConfig) (main.ts + app.config.ts)
// ---------------------------------------------------------------------------
@Component({ selector: 'legacy-root', standalone: false, template: '<router-outlet />' })
export class LegacyRootComponent {}

const appRoutes: Routes = [
  {
    path: 'users',
    canActivate: [LegacyAuthGuard],
    data: { role: 'admin' },
    loadChildren: () => Promise.resolve(LegacyUsersModule),
  },
];

@NgModule({
  declarations: [LegacyRootComponent],
  imports: [
    BrowserModule, // only in the ROOT module
    HttpClientModule, // MODERN: provideHttpClient()
    FormsModule, // template-driven forms (ngModel)
    ReactiveFormsModule,
    RouterModule.forRoot(appRoutes), // MODERN: provideRouter(routes)
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: LegacyAuthInterceptor, multi: true }],
  bootstrap: [LegacyRootComponent], // MODERN: bootstrapApplication(App)
})
export class LegacyAppModule {}

// main.ts (legacy):
//   platformBrowserDynamic().bootstrapModule(LegacyAppModule).catch(console.error);
