// src/app/features/reports/reports.routes.ts
import { Routes } from '@angular/router';
import { isAuthenticated } from '@core/guards/auth.guard';
import { ReportsApi } from './data-access/reports.api';
import { ReportsStore } from './data-access/reports.store';

import { DeliveryReportPage } from './pages/delivery-report.page';
import { PendingReportPage } from './pages/pending-report.page';
import { RequestsReportPage } from './pages/requests-report.page';
import { ReportsPreloadResolver } from './data-access/reports.preload.resolver';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [isAuthenticated],
    resolve: { preload: ReportsPreloadResolver },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'delivery' },
      { path: 'delivery', component: DeliveryReportPage },
      { path: 'pending', component: PendingReportPage },
      { path: 'requests', component: RequestsReportPage },
    ],
  },
];
