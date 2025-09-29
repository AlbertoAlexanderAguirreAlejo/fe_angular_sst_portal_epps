// core/services/cache/view-cache.service.ts
import { Injectable, inject } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from '@core/strategies/custom-route-reuse.strategy';

@Injectable({ providedIn: 'root' })
export class ViewCacheService {
  private strategy = inject(RouteReuseStrategy) as CustomRouteReuseStrategy;

  clearAll() { this.strategy.clearRouteCache(); }
  clearKey(key: string) { this.strategy.clearRouteCache(key); }
}
