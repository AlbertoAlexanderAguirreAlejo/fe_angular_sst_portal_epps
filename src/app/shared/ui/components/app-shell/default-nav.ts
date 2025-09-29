import { AppNavSection } from './nav.types';

export const DEFAULT_NAV: AppNavSection[] = [
  {
    label: 'Reportes',
    items: [
      { label: 'Acta de Entregas',          icon: 'pi pi-truck', routerLink: ['/reports/delivery'] },
      { label: 'Reporte de Solicitudes',    icon: 'pi pi-inbox', routerLink: ['/reports/requests'] },
      { label: 'Pendientes de Integración', icon: 'pi pi-clock', routerLink: ['/reports/pending'] },
    ]
  }
];
