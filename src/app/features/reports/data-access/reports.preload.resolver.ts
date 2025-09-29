// features/reports/data-access/reports.preload.resolver.ts
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { ReportsStore } from './reports.store';

export const ReportsPreloadResolver: ResolveFn<boolean> = async () => {
  const store = inject(ReportsStore);
  await store.ensureTrabajadoresLoaded();
  return true;
};
