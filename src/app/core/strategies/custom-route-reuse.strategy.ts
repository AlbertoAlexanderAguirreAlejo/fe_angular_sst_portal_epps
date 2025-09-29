// src/app/core/strategies/custom-route-reuse.strategy.ts
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private handlers: { [key: string]: DetachedRouteHandle } = {};

  // Determina si la ruta debe almacenarse
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Solo almacenar rutas de reportes
    return this.isReportRoute(route);
  }

  // Almacena el componente
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle) {
      this.handlers[this.getRouteKey(route)] = handle;
    }
  }

  // Determina si debe reutilizar una ruta almacenada
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!this.handlers[this.getRouteKey(route)];
  }

  // Recupera el componente almacenado
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.handlers[this.getRouteKey(route)] || null;
  }

  // Determina si las rutas son la misma (para reutilización)
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  // Método para limpiar cache específico (opcional)
  clearRouteCache(routeKey?: string): void {
    if (routeKey) {
      delete this.handlers[routeKey];
    } else {
      this.handlers = {};
    }
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path || '';
  }

  private isReportRoute(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    return ['delivery', 'pending', 'requests'].includes(path || '');
  }
}
