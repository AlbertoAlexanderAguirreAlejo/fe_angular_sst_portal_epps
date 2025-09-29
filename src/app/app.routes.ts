// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/ui/components/app-shell/app-shell.component';
import { canMatchAuthenticated, redirectIfAuthenticated } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth' },

  {
    path: 'auth',
    canActivate: [redirectIfAuthenticated],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'reports',
        canMatch: [canMatchAuthenticated],
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      { path: '**', redirectTo: 'reports' },
    ],
  },
];
