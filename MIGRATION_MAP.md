# MIGRATION_MAP — React → Angular

React source (read-only reference): `C:\ADME\ADME-Portal-frontend\src`
Angular target: `C:\VelSoln\AA-Angular\adme-portal-angular\src\app`

**Scope:** Login/Logout · Initiatives (Tool 1, landing page after login) · Outcome Documents (Tool 2) · Strategic Plan KPIs (Tool 3) · Data Management (Upload wizard for Tools 1–3, My Data, Submitted Data review workflow).
**Out of scope (removed):** Home/CMS, Support, Outcome Stories, Socio-Cultural Data, User Management, CMS editor, public (logged-out) pages.

Status legend: ✅ done · 🟡 partial / temporary · ⏳ planned (milestone)

## App shell & infrastructure

| React file                                                    | Angular file                                          | Concept used                                            | Status                                            |
| ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `main.tsx`                                                    | `src/main.ts` + `app/app.config.ts`                   | `bootstrapApplication`, providers                       | ✅                                                |
| `routes/__root.tsx`                                           | `app/app.ts`                                          | root component + `<router-outlet>`                      | ✅                                                |
| `routeTree.gen.ts` + `routes/*.tsx`                           | `app/app.routes.ts`                                   | `Routes` array, `loadComponent` lazy loading            | 🟡 grows per feature                              |
| `routes/_app.tsx`, `components/layout/AppLayout.tsx`          | `app/layout/app-layout.ts`                            | layout route + `children`                               | ✅                                                |
| `components/layout/Header.tsx` (579 lines)                    | `app/layout/header.ts`                                | `@for`, `routerLinkActive`, signals                     | 🟡 simplified; mega menu + role filter ⏳ M2/M3   |
| `components/layout/SiteFooter.tsx`                            | `app/layout/site-footer.ts`                           | static component, `@for`                                | ✅                                                |
| `lib/rbac/navSections.ts` (`NAV_ITEMS`, `DATABASE_MEGA_MENU`) | `app/core/constants/nav.ts`                           | typed config, `readonly`                                | 🟡 no roles yet ⏳ M2                             |
| `constants/routes.ts`                                         | `app/core/constants/routes.ts`                        | `as const`                                              | ✅                                                |
| `config/app.config.ts` + `.env*`                              | `app/core/config/app-config.ts` + `environments/*.ts` | `fileReplacements` in angular.json                      | ✅                                                |
| `vite.config.ts` `server.proxy`                               | `proxy.conf.json`                                     | dev proxy for CORS                                      | ✅                                                |
| `src/index.css`                                               | `src/styles.css`                                      | Tailwind 4 global theme                                 | ✅                                                |
| `tsconfig.app.json` strict flags                              | `tsconfig.json`                                       | `strict`, `noUncheckedIndexedAccess`, `strictTemplates` | ✅                                                |
| `eslint.config.js`                                            | `eslint.config.js` (angular-eslint)                   | `ng lint`, template a11y rules                          | ✅                                                |
| `tests/setup/handlers/*` (MSW) + `tests/fixtures/*`           | `app/core/mock-api/*`                                 | mock backend interceptor                                | 🟡 auth only; feature endpoints added per feature |

## Auth

| React file                                                                                  | Angular file                                           | Concept used                                         | Status                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------- |
| `store/auth.store.ts` (Zustand + persist)                                                   | `app/core/auth/auth.store.ts`                          | root service, `signal`, `computed`, `effect`         | ✅                                 |
| `features/auth/services/auth.service.ts` + hooks `useLogin`, `useLogout`, `useAuthCallback` | `app/core/auth/auth.service.ts`                        | service methods returning Observables                | ✅                                 |
| `features/auth/types/auth.types.ts`                                                         | `app/core/auth/auth.models.ts`                         | interfaces, literal union `Role`                     | ✅                                 |
| `lib/auth/pkce.ts`                                                                          | `app/core/auth/pkce.ts`                                | copied unchanged                                     | ✅                                 |
| `lib/axios.ts` (3 interceptors)                                                             | `app/core/http/interceptors.ts` + `http-context.ts`    | `HttpInterceptorFn`, `HttpContextToken`              | 🟡 silent token refresh ⏳ M4/M6   |
| `routes/login.tsx`                                                                          | `app/features/auth/pages/login-page.ts`                | standalone composition                               | ✅                                 |
| `features/auth/components/LoginForm.tsx` + `schemas/login.schema.ts`                        | `app/features/auth/components/login-form.ts` + `.html` | Reactive Forms, `Validators`                         | ✅                                 |
| `features/auth/components/LoginBrandPanel.tsx`                                              | `app/features/auth/components/login-brand-panel.ts`    | presentational component                             | ✅                                 |
| `routes/callback.tsx` + `useAuthCallback.ts`                                                | `app/features/auth/pages/callback-page.ts`             | `input()` from query params, `ngOnInit`, `switchMap` | ✅                                 |
| `lib/rbac/routeGuard.ts` (`beforeLoad`)                                                     | `app/core/auth/auth.guard.ts`                          | functional `CanActivateFn`                           | 🟡 auth only; role guards ⏳ M2/M6 |
| `lib/rbac/capabilities.ts`, `useCan`, `RequireCapability`                                   | —                                                      | `capabilityGuard`, `*appCan` directive               | ⏳ M2                              |

## Models (M1 — TypeScript)

| React file                                                    | Angular file                                                     | Status |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| `features/initiatives/types/initiatives.types.ts`             | `features/initiatives/models/initiatives.models.ts`              | ✅     |
| `features/initiatives/types/initiativesFilters.types.ts`      | `features/initiatives/models/initiatives-filters.models.ts`      | ✅     |
| `features/initiatives/types/activityDetails.types.ts`         | `features/initiatives/models/activity-details.models.ts`         | ✅     |
| `features/initiatives/types/chartDrill.types.ts`              | `features/initiatives/models/chart-drill.models.ts`              | ✅     |
| `features/outcome-documents/types/outcome-documents.types.ts` | `features/outcome-documents/models/outcome-documents.models.ts`  | ✅     |
| `features/blueprint-kpi/types/blueprint-kpi.types.ts`         | `features/blueprint-kpi/models/blueprint-kpi.models.ts`          | ✅     |
| `features/data-management/types/*.types.ts` (10 files)        | `features/data-management/models/*.models.ts` (kebab-case names) | ✅     |

## Features (pages & components)

| React                                                                           | Angular (planned location)                                       | Milestone                                                         |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `routes/_app.initiatives*.tsx`, `features/initiatives/components/*`             | `features/initiatives/` (`initiatives.routes.ts`, pages, charts) | ⏳ M2 (currently the M1 Welcome page stands in at `/initiatives`) |
| `routes/_app.outcome-documents*.tsx`, `features/outcome-documents/components/*` | `features/outcome-documents/`                                    | ⏳ M2                                                             |
| `routes/_app.blueprint-kpi*.tsx`, `features/blueprint-kpi/components/*`         | `features/blueprint-kpi/`                                        | ⏳ M2                                                             |
| `routes/_app.data-management*.tsx`, `features/data-management/*`                | `features/data-management/` (tool adapters via `InjectionToken`) | ⏳ M2–M3                                                          |
| Zustand filter stores (4)                                                       | signal-based feature services                                    | ⏳ M2                                                             |
| TanStack Table tables (3)                                                       | Angular Material `mat-table`                                     | ⏳ M3                                                             |
| chart.js / react-chartjs-2 charts (11)                                          | Chart.js wrapper component                                       | ⏳ M2 (item 11)                                                   |
| `createPortal` / `FloatingPortal`                                               | CDK Overlay                                                      | ⏳ M3                                                             |
| sonner toasts                                                                   | `MatSnackBar`                                                    | ⏳ M3                                                             |

## New in Angular (no React equivalent)

| File                                                         | Why                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `features/welcome/welcome-page.ts`                           | M1 practice Welcome page reused in Angular; temporary landing page until Initiatives (M2) |
| `core/mock-api/mock-backend.interceptor.ts`, `mock-users.ts` | offline mock backend (`environment.useMocks`)                                             |
| `practice/m1-web-fundamentals/*`                             | M1 plain HTML/CSS/JS/TS practice (not part of the Angular build)                          |
