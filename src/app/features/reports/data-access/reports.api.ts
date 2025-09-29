// features/reports/data-access/reports.api.ts
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { GraphQLService } from '@core/services/api/graphql.api';
import { Tracked } from '@core/services/network/request-manager.service';
import { Q_ENTREGAS, Q_SOLICITUDES, Q_PENDIENTES, Q_TRABAJADORES, M_RECHAZAR } from './reports.gql';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private gql = inject(GraphQLService);

  fetchEntregasCancellable(params: { fini: string; ffin: string; nroDoc: string[] })
  : Tracked<{ data: { controlEppsReporteEntregas: any[] }; errors?: any[] }> {
    return this.gql.requestCancellable<{ controlEppsReporteEntregas: any[] }>(
      Q_ENTREGAS, params, `Reporte Entregas`,
    );
  }

  fetchSolicitudesCancellable(params: { fini: string; ffin: string; nroDoc: string[] })
  : Tracked<{ data: { controlEppsReporteSolicitudes: any[] }; errors?: any[] }> {
    return this.gql.requestCancellable<{ controlEppsReporteSolicitudes: any[] }>(
      Q_SOLICITUDES, params, `Reporte Solicitudes`
    );
  }

  fetchPendientesCancellable()
  : Tracked<{ data: { controlEppsReportePendientesIntegracion: any[] }; errors?: any[] }> {
    return this.gql.requestCancellable<{ controlEppsReportePendientesIntegracion: any[] }>(
      Q_PENDIENTES, undefined, 'Pendientes'
    );
  }

  buscarTrabajadores(flagEstado: string) {
    return this.gql.request<{ buscarBsTrabajadores: any[] }>(Q_TRABAJADORES, { flagEstado })
      .pipe(map(r => r.data?.buscarBsTrabajadores ?? []));
  }

  rechazarEquipo(id: number) {
    return this.gql.request<{ controlEppsRechazarEquipo: boolean }>(M_RECHAZAR, { id })
      .pipe(map(r => !!r.data?.controlEppsRechazarEquipo));
  }
}
