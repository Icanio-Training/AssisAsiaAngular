import type { Routes } from '@angular/router';

import { authGuard, guestOnlyGuard } from '@core/auth/auth.guard';
import { capabilityMatch } from '@core/rbac/capability.guard';

// CONCEPT: route configuration | REACT: src/routes/*.tsx file routes + generated routeTree.gen.ts | INTERVIEW: the whole tree is one typed array; loadComponent / loadChildren lazy-load each feature into its own JS chunk.
//
//   routes/login.tsx                 → { path: 'login' }
//   routes/_app.tsx (pathless layout) → { path: '', loadComponent: AppLayout, children: [...] }
//   routes/_app.initiatives*.tsx      → { path: 'initiatives', loadChildren: initiatives.routes }
//   beforeLoad: requireCapability(x)  → canMatch: [capabilityMatch(x)] (+ canActivate inside the feature)
//
// Guard types used in this app:
//   canActivate   — authGuard (must be logged in), guestOnlyGuard (skip login when logged in)
//   canMatch      — capabilityMatch: a role without access never downloads the feature chunk;
//                   the URL then falls through to the '**' 404 route
//   canDeactivate — unsavedChangesGuard on Data Management forms
//   resolve       — feature routes pre-load data before showing a detail page
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign In | ADME',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./features/auth/pages/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    title: 'Signing in… | ADME',
    loadComponent: () => import('./features/auth/pages/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-layout').then((m) => m.AppLayout),
    children: [
      // pathMatch 'full': redirect only when the remaining URL is exactly '' (i.e. "/").
      { path: '', pathMatch: 'full', redirectTo: 'initiatives' },
      {
        path: 'initiatives',
        canMatch: [capabilityMatch('initiatives:view')],
        loadChildren: () => import('./features/initiatives/initiatives.routes'),
      },
      {
        path: 'outcome-documents',
        canMatch: [capabilityMatch('outcome-documents:view')],
        loadChildren: () => import('./features/outcome-documents/outcome-documents.routes'),
      },
      {
        path: 'blueprint-kpi',
        canMatch: [capabilityMatch('blueprint-kpi:view')],
        loadChildren: () => import('./features/blueprint-kpi/blueprint-kpi.routes'),
      },
      {
        path: 'data-management',
        canMatch: [capabilityMatch('data-management:access')],
        loadChildren: () => import('./features/data-management/data-management.routes'),
      },
      {
        path: 'practice/students',
        title: 'Practice: Students | ADME',
        loadChildren: () => import('./features/practice-students/practice-students.routes'),
      },
      {
        path: '**',
        title: 'Not found | ADME',
        loadComponent: () =>
          import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
