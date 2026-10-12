import { provideNativeDateAdapter } from '@angular/material/core';
import type { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { studentResolver } from './data/student.resolver';
import { PracticeStudentsShell } from './pages/practice-students-shell';

// CONCEPT: lazy child routes | REACT: nested TanStack/React Router routes with lazy() | INTERVIEW: app.routes.ts does `loadChildren: () => import('./…routes')`; this file's default export becomes that chunk's routes, and `loadComponent` splits each page into its own chunk too.
// Mounted at /practice/students:
//   /practice/students           → redirect to list
//   /practice/students/list      → StudentListPage
//   /practice/students/new       → StudentFormPage   (canDeactivate)
//   /practice/students/:id       → StudentDetailPage (resolve)
//   /practice/students/:id/edit  → StudentFormPage   (canDeactivate)
export default [
  {
    path: '',
    component: PracticeStudentsShell,
    // CONCEPT: route-level providers | REACT: a Provider wrapping only these routes | INTERVIEW: providers on a route are visible to every component under it — here the Date adapter mat-datepicker needs.
    providers: [provideNativeDateAdapter()],
    children: [
      // pathMatch 'full': only redirect when the remaining URL is EMPTY ('prefix' would match everything).
      { path: '', pathMatch: 'full', redirectTo: 'list' },
      {
        path: 'list',
        title: 'Students | Practice',
        loadComponent: () => import('./pages/student-list.page').then((m) => m.StudentListPage),
      },
      {
        path: 'new', // must come BEFORE ':id', or "new" would be read as an id
        title: 'Add student | Practice',
        loadComponent: () => import('./pages/student-form.page').then((m) => m.StudentFormPage),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: ':id',
        title: 'Student | Practice',
        loadComponent: () => import('./pages/student-detail.page').then((m) => m.StudentDetailPage),
        // The page receives this as `student = input.required<Student>()`.
        resolve: { student: studentResolver },
      },
      {
        path: ':id/edit',
        title: 'Edit student | Practice',
        loadComponent: () => import('./pages/student-form.page').then((m) => m.StudentFormPage),
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
] satisfies Routes;
