// src/app/core/providers/route-reuse.provider.ts
import { Provider } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from '@core/strategies/custom-route-reuse.strategy';

export const CUSTOM_ROUTE_REUSE_PROVIDER: Provider = {
  provide: RouteReuseStrategy,
  useClass: CustomRouteReuseStrategy
};
