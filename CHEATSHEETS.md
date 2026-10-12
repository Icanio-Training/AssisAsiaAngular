# CHEATSHEETS

Quick-reference tables for every syllabus topic.

**Contents:** Binding syntax · HTML5 · CSS3 · JavaScript · TypeScript · Lifecycle hooks · Guards & routing · Signals vs RxJS · RxJS operator chooser · HTTP verbs & status codes · Angular Material · Performance · Security · Git · Docker · kubectl / oc · AWS ↔ Azure ↔ OpenShift

---

## Angular template binding syntax

| Want to…                   | React (JSX)                      | Angular template                                 |
| -------------------------- | -------------------------------- | ------------------------------------------------ |
| Show a value               | `{user.name}`                    | `{{ user().name }}`                              |
| Set a property             | `src={url}`                      | `[src]="url"`                                    |
| Set an attribute           | `aria-label={x}`                 | `[attr.aria-label]="x"`                          |
| Toggle a class             | `className={a ? 'x' : ''}`       | `[class.x]="a"` or `[class]="expr"`              |
| Set a style / CSS variable | `style={{ color }}`              | `[style.color]="color"` · `[style.--accent]="c"` |
| Handle an event            | `onClick={save}`                 | `(click)="save()"`                               |
| Two-way                    | `value` + `onChange`             | `[(ngModel)]="x"` · `formControlName="x"`        |
| If / else                  | `{a ? <A/> : <B/>}`              | `@if (a) { … } @else { … }`                      |
| Loop                       | `list.map(i => <li key={i.id}>)` | `@for (i of list; track i.id) { <li> }`          |

---

## HTML5 essentials

| Need                              | Use                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Page regions                      | `<header>` `<nav>` `<main>` (one) `<section>` `<article>` `<aside>` `<footer>` |
| Action                            | `<button type="button">` (never a clickable `<div>`)                           |
| Navigation                        | `<a href>` / `<a routerLink>`                                                  |
| Form field                        | `<label for="id">` + `<input id="id" type=… autocomplete=…>`                   |
| Error announced to screen readers | `role="alert"` or `aria-live="polite"`                                         |
| Decorative image                  | `alt=""` (+ `aria-hidden="true"` on icons)                                     |
| Responsive on phones              | `<meta name="viewport" content="width=device-width, initial-scale=1">`         |

Input types: `email` `password` `number` `tel` `url` `date` `checkbox` `radio` `file` `search`.
Validation attributes: `required` `minlength` `maxlength` `min` `max` `pattern`.

---

## CSS3 layout chooser

| Situation                                     | Use                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Items in one row / column, centring, toolbars | **Flexbox** `display:flex; gap; justify-content; align-items`                                           |
| Rows **and** columns, card grids, page layout | **Grid** `display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`                    |
| Stay at top while scrolling                   | `position: sticky; top: 0`                                                                              |
| Overlay pinned to the screen                  | `position: fixed; inset: 0`                                                                             |
| Badge on a corner                             | parent `position: relative` + child `position: absolute`                                                |
| One-line `…`                                  | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` (+ width limit, `min-width:0` in flex) |
| Multi-line `…`                                | `line-clamp: 3`                                                                                         |
| Theme token                                   | `:root { --brand: #2c59a7 }` → `color: var(--brand)`                                                    |

Position values: `static` (default) · `relative` · `absolute` · `fixed` · `sticky`.
Box model: content → padding → border → margin. Always `box-sizing: border-box`.
Breakpoints (Tailwind, mobile-first `min-width`): `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.

### Angular view encapsulation

| Mode                 | Effect                                      | Use when                         |
| -------------------- | ------------------------------------------- | -------------------------------- |
| `Emulated` (default) | styles scoped via `_ngcontent-*` attributes | almost always                    |
| `None`               | styles become global                        | rare: theming third-party markup |
| `ShadowDom`          | native Shadow DOM isolation                 | web components                   |

---

## JavaScript essentials

| Topic                                         | Remember                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `const` / `let` / `var`                       | `const` by default, `let` if reassigned, never `var`                                                     |
| `map` / `filter` / `find` / `some` / `reduce` | return new values — don't mutate state                                                                   |
| Immutable add / remove / update               | `[...list, x]` · `list.filter(i => i.id !== id)` · `list.map(i => i.id === id ? {...i, done: true} : i)` |
| Copy object without a field                   | `const { password, ...safe } = user`                                                                     |
| JSON                                          | `JSON.stringify(obj)` ↔ `JSON.parse(str)` (wrap parse in try/catch)                                      |
| Promise helpers                               | `Promise.all` (fail fast) · `allSettled` (all results) · `race` · `any`                                  |
| `fetch` gotcha                                | doesn't reject on 404 — check `response.ok`                                                              |
| Safe text                                     | `el.textContent = x` (never `innerHTML` with user/API data)                                              |
| `this`                                        | the object before the dot; arrows inherit `this`                                                         |
| Event loop order                              | sync → microtasks (Promise) → macrotask (setTimeout)                                                     |
| `??` vs `\|\|`                                | `??` only replaces null/undefined                                                                        |

---

## TypeScript essentials

| Need                            | Write                                            |
| ------------------------------- | ------------------------------------------------ |
| Object model                    | `interface User { id: string; name?: string }`   |
| Fixed set of strings            | `type Role = 'admin' \| 'guest'`                 |
| Constant object, literal values | `const ROUTES = { … } as const`                  |
| Function types                  | `function f(a: string): Promise<User>`           |
| Generic                         | `function first<T>(xs: T[]): T \| undefined`     |
| Generic constraint              | `<T extends { id: string }>`                     |
| All optional / required         | `Partial<T>` / `Required<T>`                     |
| Some / all but some fields      | `Pick<T, 'a' \| 'b'>` / `Omit<T, 'id'>`          |
| Map every key                   | `Record<Role, string>`                           |
| Immutable                       | `Readonly<T>`, `readonly` fields, `readonly T[]` |
| Unknown data                    | `unknown` + narrowing (not `any`)                |
| Exhaustive switch               | `default: const x: never = value;`               |

Angular-relevant `tsconfig.json` flags: `strict` · `noUncheckedIndexedAccess` · `exactOptionalPropertyTypes` · `experimentalDecorators` · `paths` (aliases) · Angular: `strictTemplates`, `strictStandalone`.

---

## Lifecycle hooks (order)

| #   | Hook                              | Runs                                                           | Use for                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 0   | `constructor`                     | once, when the class is created                                | `inject()`, `effect()`, field init — inputs NOT set yet                              |
| 1   | `ngOnChanges(changes)`            | before init + every time an `@Input` reference changes         | reacting to input changes (signals: use `computed`/`effect` instead)                 |
| 2   | `ngOnInit`                        | once, after the first `ngOnChanges`                            | initial data load that needs inputs                                                  |
| 3   | `ngDoCheck`                       | every change detection                                         | custom change detection — keep it tiny (runs constantly)                             |
| 4   | `ngAfterContentInit` / `…Checked` | after projected `<ng-content>` is ready / checked              | `contentChild()` access                                                              |
| 5   | `ngAfterViewInit` / `…Checked`    | after the component's own view (+ children) is ready / checked | DOM / `viewChild()` / third-party libs (Chart.js)                                    |
| 6   | `ngOnDestroy`                     | once, before removal                                           | cleanup: `chart.destroy()`, timers (or `DestroyRef.onDestroy`, `takeUntilDestroyed`) |

Modern helpers: `afterNextRender()` / `afterRenderEffect()` (run after the DOM updates), `DestroyRef`.

---

## Guards & routing

| Type               | Question it answers                                                     | In this project                                       |
| ------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `canActivate`      | may the user enter this route?                                          | `authGuard`, `guestOnlyGuard`, `capabilityGuard(...)` |
| `canActivateChild` | may the user enter any child?                                           | same idea, applied once for all children              |
| `canMatch`         | should this route config even be considered? (runs before lazy loading) | `capabilityMatch(...)` in `app.routes.ts`             |
| `canDeactivate`    | may the user LEAVE?                                                     | `unsavedChangesGuard` on forms                        |
| `resolve`          | load data before showing the page                                       | detail pages (feature routes)                         |

Return values: `true` (allow) · `false` (block) · `UrlTree` via `router.parseUrl('/x')` (redirect) · or an Observable/Promise of these.

| Routing feature     | Syntax                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Lazy component      | `loadComponent: () => import('./x').then(m => m.X)`                                       |
| Lazy child routes   | `loadChildren: () => import('./feature.routes')` (default export)                         |
| Route param → input | `{ path: ':id' }` + `id = input.required<string>()` (needs `withComponentInputBinding()`) |
| Query param → input | `?kpi=5` → `kpi = input<string>()`                                                        |
| Redirect            | `{ path: '', pathMatch: 'full', redirectTo: 'initiatives' }`                              |
| 404                 | `{ path: '**', component: NotFound }` — **last**                                          |
| Navigate in code    | `router.navigate(['/x', id], { queryParams: { tab: 1 } })` / `navigateByUrl('/x')`        |
| Link                | `<a [routerLink]="['/x', id]" [queryParams]="{ a: 1 }" routerLinkActive="active">`        |
| Page title          | `{ path: 'x', title: 'X \| ADME' }`                                                       |

Gotcha: with `withComponentInputBinding()`, every `input()` of a ROUTED component is set from params / query params / data — inputs with no matching key become `undefined` (overriding defaults). Default in `computed()`.

---

## Signals vs RxJS — which one?

| Use **signals** for                             | Use **RxJS** for                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| state the template reads (`signal`, `computed`) | events over time: HTTP, typing, router events, websockets                 |
| derived values (`computed`)                     | cancelling / racing / combining async work (`switchMap`, `combineLatest`) |
| simple side effects on state change (`effect`)  | timing (`debounceTime`, `retry`, `timer`)                                 |
|                                                 | sharing one request with many subscribers (`shareReplay`)                 |

Bridges: `toSignal(obs$)` · `toObservable(sig)` · `rxResource({ params, stream })`.

---

## RxJS operator chooser

| I want to…                                         | Operator                                   | Example in this app                                   |
| -------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| transform each value                               | `map`                                      | `map(toUser)` in `core/auth/auth.service.ts`          |
| keep only some values                              | `filter`                                   | router events → `NavigationEnd` in `layout/header.ts` |
| do a side effect (log, save)                       | `tap`                                      | store tokens after login                              |
| run cleanup on complete/error/unsubscribe          | `finalize`                                 | loading counter in `loadingInterceptor`               |
| new request per value, **cancel the previous**     | `switchMap`                                | search-as-you-type, route param → load                |
| new request per value, **all in parallel**         | `mergeMap`                                 | independent fire-and-forget calls                     |
| new request per value, **one at a time, in order** | `concatMap`                                | sequential uploads / ordered saves                    |
| **ignore** new values while busy                   | `exhaustMap`                               | Save / Submit buttons (double-click safe)             |
| wait for the user to stop typing                   | `debounceTime(300)`                        | search boxes                                          |
| skip if same as last                               | `distinctUntilChanged`                     | search term                                           |
| combine the latest of several streams              | `combineLatest`                            | filters + page + sort → table                         |
| run several requests in parallel, get all results  | `forkJoin`                                 | the 7 declaration dropdowns                           |
| read another stream's latest when this one emits   | `withLatestFrom`                           | submit click + current state                          |
| recover from an error                              | `catchError`                               | fallback value / error toast                          |
| try again                                          | `retry({ count, delay })`                  | `retryGetInterceptor` (GET only)                      |
| cache / share one execution                        | `shareReplay({ bufferSize: 1, refCount })` | token-refresh dedupe, dropdown cache                  |
| start with a value                                 | `startWith`                                | `loading: true` before the first response             |
| accumulate                                         | `scan`                                     | running totals / undo stacks                          |
| stop on destroy                                    | `takeUntilDestroyed()`                     | every component subscription                          |
| fail if too slow                                   | `timeout(ms)`                              | `apiUrlInterceptor`                                   |

Subjects: `Subject` (no initial value) · `BehaviorSubject` (holds the current value) · `ReplaySubject(n)` (replays the last n) · `AsyncSubject` (last value, on complete).
Leak rule: HTTP Observables complete by themselves; `interval`, `fromEvent`, `valueChanges`, router events and Subjects do NOT → always `takeUntilDestroyed`, the `async` pipe or `toSignal`.

---

## HTTP verbs & status codes

| Verb   | Meaning                    | Idempotent?    | Safe to auto-retry?          |
| ------ | -------------------------- | -------------- | ---------------------------- |
| GET    | read                       | yes            | yes (our retry interceptor)  |
| POST   | create / action            | no             | no (could create duplicates) |
| PUT    | replace the whole resource | yes            | usually                      |
| PATCH  | update some fields         | not guaranteed | no                           |
| DELETE | remove                     | yes            | usually                      |

| Code                  | Meaning                                | App behaviour                       |
| --------------------- | -------------------------------------- | ----------------------------------- |
| 200 / 201 / 204       | OK / Created / No content              | success                             |
| 400                   | bad request                            | show message                        |
| **401**               | not authenticated (no / expired token) | silent refresh → retry, else logout |
| **403**               | authenticated but NOT allowed          | "You don't have permission" toast   |
| 404                   | not found                              | not-found state                     |
| 409                   | conflict (e.g. duplicate)              | show message                        |
| 422                   | validation failed (Laravel `errors`)   | map onto form fields                |
| 429                   | too many requests                      | back off                            |
| 500 / 502 / 503 / 504 | server / gateway errors                | toast + retry GET once              |
| 0                     | network / CORS failure                 | "Network error" toast               |

---

## Angular Material quick map

| Need                              | Component                                                                  | Notes                                          |
| --------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| Menus / dropdowns                 | `mat-menu` + `[matMenuTriggerFor]`                                         | `layout/header.ts`                             |
| Toasts                            | `MatSnackBar`                                                              | wrapped by `NotificationService`               |
| Modal                             | `MatDialog.open(Comp, { data })` + `MAT_DIALOG_DATA`                       | `shared/ui/confirm-dialog.ts`                  |
| Inputs                            | `mat-form-field` + `matInput` + `mat-error`                                | errors show when touched + invalid             |
| Select                            | `mat-select` (`multiple`)                                                  | filters                                        |
| Dates                             | `mat-datepicker` + `provideNativeDateAdapter()`                            | practice students                              |
| Table                             | `mat-table` + `matSort` + `mat-paginator`                                  | server-side: react to `sortChange` / `page`    |
| Tabs / cards / spinner / progress | `mat-tab-group` · `mat-card` · `mat-progress-spinner` · `mat-progress-bar` |                                                |
| Positioned overlay                | CDK `Overlay` / `cdkConnectedOverlay`                                      | tooltips, custom dropdowns                     |
| Long lists                        | CDK `cdk-virtual-scroll-viewport`                                          | renders only the visible rows                  |
| Drag & drop                       | CDK `cdkDropList` + `cdkDrag` + `moveItemInArray`                          |                                                |
| Theming                           | `mat.theme((color, typography, density))` in `src/material-theme.scss`     | light/dark via `color-scheme`                  |
| Style override                    | component tokens (`--mat-…`) / `mat.*-overrides()` mixins                  | avoid `::ng-deep` (deprecated, leaks globally) |

---

## Performance checklist

| Technique                                            | Where                                                    |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Lazy routes (`loadComponent` / `loadChildren`)       | `app.routes.ts` — one chunk per feature                  |
| Preloading (`withPreloading(PreloadAllModules)`)     | `app.config.ts`                                          |
| `@defer (on viewport)`                               | below-the-fold chart sections                            |
| `OnPush` + signals + zoneless                        | every component                                          |
| `track` in `@for`                                    | every list                                               |
| Pure pipes instead of template method calls          | `shared/pipes/initials.pipe.ts`                          |
| `NgOptimizedImage` (`ngSrc` + width/height)          | `shared/ui/empty-state.ts`, KPI icons                    |
| Virtual scrolling                                    | practice students activity log                           |
| `runOutsideAngular` for heavy libraries              | `shared/ui/chart.ts`                                     |
| debounce + `switchMap` (fewer, cancellable requests) | search boxes                                             |
| `shareReplay` caching                                | dropdowns, token refresh                                 |
| Budgets (`angular.json`)                             | build fails if the initial bundle grows past the limit   |
| gzip + immutable caching of hashed files             | `deploy/nginx/nginx.conf`                                |
| Measure first                                        | `npm run analyze`, Lighthouse, Angular DevTools profiler |

---

## Security checklist

| Threat / topic          | Defence in this project                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| XSS                     | Angular escapes `{{ }}` and sanitizes `[innerHTML]`; never `bypassSecurityTrust*` without a reason; CSP header |
| Token theft             | short-lived access token; refresh token in memory only; prefer an HttpOnly cookie when the backend supports it |
| CSRF                    | Bearer tokens aren't sent automatically; `withXsrfConfiguration` for cookie-based auth                         |
| Clickjacking            | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`                                                         |
| Downgrade to HTTP       | HSTS on the Ingress / Route                                                                                    |
| Secrets in the bundle   | none — public IDs only; per-environment values via config.json / Key Vault                                     |
| Vulnerable dependencies | `npm audit` in CI (fail on high)                                                                               |
| Authorization           | guards are UX only — the API returns 401 / 403                                                                 |

---

## Git

| Task                                   | Command                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| New feature branch                     | `git switch -c feature/AA-123-initiatives-charts`                                           |
| Stage / commit (Conventional Commits)  | `git add -p` · `git commit -m "feat(initiatives): add chart drill-down"`                    |
| Update from main (linear history)      | `git fetch origin` · `git rebase origin/main`                                               |
| Update from main (merge commit)        | `git merge origin/main`                                                                     |
| Resolve conflicts                      | edit the files → `git add <file>` → `git rebase --continue` (or `git commit` after a merge) |
| Undo the last commit, keep the changes | `git reset --soft HEAD~1`                                                                   |
| Undo a pushed commit safely            | `git revert <sha>`                                                                          |
| Stash work                             | `git stash push -m "wip"` · `git stash pop`                                                 |
| Tag a release                          | `git tag -a v1.2.0 -m "Release 1.2.0"` · `git push origin v1.2.0`                           |
| History                                | `git log --oneline --graph --decorate`                                                      |

Commit types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` (enforced by `.husky/commit-msg`; `.husky/pre-commit` runs lint-staged).
GitFlow: `main` + `develop` + `feature/*` + `release/*` + `hotfix/*`. Trunk-based: short-lived branches into `main` + feature flags.
Rebase vs merge: rebase replays your commits on top of the latest main (clean history — never rebase a shared branch); merge keeps history as it happened (adds a merge commit).

---

## Docker

| Task                | Command                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Build               | `docker build -t adme-portal-angular:local .`                                                                                          |
| Run                 | `docker run --rm -p 8080:8080 adme-portal-angular:local`                                                                               |
| Run with a config   | `docker run --rm -p 8080:8080 -v ./deploy/k8s/overlays/dev/config.json:/usr/share/nginx/html/config.json:ro adme-portal-angular:local` |
| Image size / layers | `docker images` · `docker history adme-portal-angular:local`                                                                           |
| Shell inside        | `docker exec -it <container> sh`                                                                                                       |

---

## kubectl / oc

| Task                       | kubectl                                                     | oc (OpenShift)                                  |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Preview rendered manifests | `kubectl kustomize deploy/k8s/overlays/dev`                 | same                                            |
| Validate without applying  | `kubectl apply -k deploy/k8s/overlays/dev --dry-run=server` | `oc apply -k deploy/openshift --dry-run=server` |
| Deploy                     | `kubectl apply -k deploy/k8s/overlays/dev`                  | `oc apply -k deploy/openshift`                  |
| Status                     | `kubectl -n adme-dev get pods,svc,ingress,hpa`              | `oc get pods,svc,route`                         |
| Rollout progress           | `kubectl -n adme-dev rollout status deploy/adme-portal`     | `oc rollout status deploy/adme-portal`          |
| Rollback                   | `kubectl -n adme-dev rollout undo deploy/adme-portal`       | `oc rollout undo deploy/adme-portal`            |
| Logs                       | `kubectl -n adme-dev logs -l app=adme-portal -f`            | `oc logs -f deploy/adme-portal`                 |
| Why is a pod failing?      | `kubectl -n adme-dev describe pod <pod>`                    | `oc describe pod <pod>`                         |
| Scale                      | `kubectl -n adme-dev scale deploy/adme-portal --replicas=3` | `oc scale deploy/adme-portal --replicas=3`      |
| Port-forward               | `kubectl -n adme-dev port-forward svc/adme-portal 8080:80`  | `oc port-forward svc/adme-portal 8080:80`       |
| New environment            | `kubectl create namespace adme-uat`                         | `oc new-project adme-uat`                       |
| Build in the cluster       | —                                                           | `oc start-build adme-portal --follow`           |
| Expose                     | Ingress YAML                                                | `oc expose svc/adme-portal` (creates a Route)   |

---

## AWS ↔ Azure ↔ OpenShift

| Need                          | AWS (your experience)                 | Azure                                  | OpenShift                               |
| ----------------------------- | ------------------------------------- | -------------------------------------- | --------------------------------------- |
| Container registry            | ECR                                   | ACR                                    | internal registry + ImageStreams / Quay |
| Managed Kubernetes            | EKS                                   | AKS                                    | OpenShift (OCP / ROSA / ARO)            |
| Static SPA hosting            | S3 + CloudFront                       | Static Web Apps / Storage + Front Door | —                                       |
| Container web app without k8s | App Runner / ECS                      | App Service for Containers             | —                                       |
| CI/CD                         | CodePipeline / CodeBuild (or Jenkins) | Azure DevOps Pipelines                 | OpenShift Pipelines (Tekton)            |
| Secrets                       | Secrets Manager / Parameter Store     | Key Vault                              | Secrets (+ Vault)                       |
| Identity / SSO                | Cognito / IAM Identity Center         | Entra ID (Azure AD)                    | OAuth server / Keycloak                 |
| Ingress                       | AWS Load Balancer Controller (ALB)    | Application Gateway / NGINX ingress    | Routes (HAProxy router)                 |
| Pod → cloud permissions       | IRSA / Pod Identity                   | Workload Identity                      | ServiceAccounts + SCCs                  |
