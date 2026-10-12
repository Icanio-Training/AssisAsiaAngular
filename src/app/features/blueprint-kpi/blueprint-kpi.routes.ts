import type { Routes } from '@angular/router';

// Ported from React: routes/_app.blueprint-kpi.tsx (layout), _app.blueprint-kpi.index.tsx,
// _app.blueprint-kpi.$goalId.tsx. The capability check ('blueprint-kpi:view') is the canMatch
// in app.routes.ts.
export default [
  {
    path: '',
    loadComponent: () => import('./blueprint-kpi-layout').then((m) => m.BlueprintKpiLayout),
    children: [
      {
        path: '',
        title: 'ASCC Strategic Plan KPIs | ADME',
        loadComponent: () => import('./pages/blueprint-kpi-page').then((m) => m.BlueprintKpiPage),
      },
      {
        // :goalId and ?kpi= arrive as the page's goalId / kpi inputs (withComponentInputBinding).
        path: ':goalId',
        title: 'Strategic Goal | ADME',
        loadComponent: () => import('./pages/strategic-goal-page').then((m) => m.StrategicGoalPage),
      },
    ],
  },
] satisfies Routes;
