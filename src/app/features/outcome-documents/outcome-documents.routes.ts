import type { Routes } from '@angular/router';

import { declarationDetailResolver } from './resolvers/declaration-detail.resolver';

// Mounted at /outcome-documents by app.routes.ts (canMatch: outcome-documents:view).
// React files: _app.outcome-documents.index.tsx / .matrix.index.tsx / .matrix.$id.tsx
// Each page lazy-loads into its own chunk; query params (?sector, ?country), the :id param and
// resolved data reach the pages as input()s via withComponentInputBinding().
export default [
  {
    path: '',
    pathMatch: 'full',
    title: 'ASCC Outcome Documents | ADME',
    loadComponent: () =>
      import('./pages/outcome-documents-page').then((m) => m.OutcomeDocumentsPage),
  },
  {
    path: 'matrix',
    title: 'Monitoring Matrix | ADME',
    loadComponent: () =>
      import('./pages/monitoring-matrix-page').then((m) => m.MonitoringMatrixPage),
  },
  {
    path: 'matrix/:id',
    title: 'Declaration Detail | ADME',
    resolve: { declaration: declarationDetailResolver },
    loadComponent: () =>
      import('./pages/declaration-detail-page').then((m) => m.DeclarationDetailPage),
  },
] satisfies Routes;
