// features/reports/data-access/reports.store.ts
import { inject, signal, computed, Injectable } from '@angular/core';
import { ReportsApi } from './reports.api';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  private api = inject(ReportsApi);

  // Estado de datos
  listaTrabajadores = signal<any[]>([]);
  listaEntregas     = signal<any[]>([]);
  listaSolicitudes  = signal<any[]>([]);
  listaPendientes   = signal<any[]>([]);

  // Flags
  trabajadoresLoaded = signal(false);

  // Loading por recurso
  loadingEntregas    = signal(false);
  loadingSolicitudes = signal(false);
  loadingPendientes  = signal(false);
  loading = computed(() => this.loadingEntregas() || this.loadingSolicitudes() || this.loadingPendientes());

  error = signal<string | null>(null);

  // Handlers de requests en curso (cancelación)
  private reqEntregas:    { cancel: () => void } | null = null;
  private reqSolicitudes: { cancel: () => void } | null = null;
  private reqPendientes:  { cancel: () => void } | null = null;

  async loadTrabajadores() {
    this.error.set(null);
    try {
      const estadoActivo = '1';
      const data = await firstValueFrom(this.api.buscarTrabajadores(estadoActivo));
      this.listaTrabajadores.set(data);
      this.trabajadoresLoaded.set(true);
    } catch (e: any) {
      this.error.set(e?.domainError?.message || e?.message || 'Error al cargar trabajadores');
    }
  }

  async ensureTrabajadoresLoaded() {
    if (this.trabajadoresLoaded()) return;
    await this.loadTrabajadores();
  }

  async rechazarEquipo(id: number) {
    this.error.set(null);
    try { return await firstValueFrom(this.api.rechazarEquipo(id)); }
    catch (e: any) { this.error.set(e?.domainError?.message || e?.message || 'Error al rechazar equipo'); throw e; }
  }

  // --- Cancelables
  loadEntregas(p: { fini: string; ffin: string; nroDoc: string[] }) {
    // cancelar si hay uno en curso
    this.reqEntregas?.cancel?.();
    this.loadingEntregas.set(true);
    this.error.set(null);

    const tracked = this.api.fetchEntregasCancellable(p);
    this.reqEntregas = tracked;

    tracked.subscribe(
      resp => this.listaEntregas.set(resp.data?.controlEppsReporteEntregas ?? []),
      e => this.error.set(e?.domainError?.message || e?.message || 'Error al cargar entregas'),
      () => { this.loadingEntregas.set(false); this.reqEntregas = null; }
    );
  }

  loadSolicitudes(p: { fini: string; ffin: string; nroDoc: string[] }) {
    this.reqSolicitudes?.cancel?.();
    this.loadingSolicitudes.set(true);
    this.error.set(null);

    const tracked = this.api.fetchSolicitudesCancellable(p);
    this.reqSolicitudes = tracked;

    tracked.subscribe(
      resp => this.listaSolicitudes.set(resp.data?.controlEppsReporteSolicitudes ?? []),
      e => this.error.set(e?.domainError?.message || e?.message || 'Error al cargar solicitudes'),
      () => { this.loadingSolicitudes.set(false); this.reqSolicitudes = null; }
    );
  }

  loadPendientes() {
    this.reqPendientes?.cancel?.();
    this.loadingPendientes.set(true);
    this.error.set(null);

    const tracked = this.api.fetchPendientesCancellable();
    this.reqPendientes = tracked;

    tracked.subscribe(
      resp => this.listaPendientes.set(resp.data?.controlEppsReportePendientesIntegracion ?? []),
      e => this.error.set(e?.domainError?.message || e?.message || 'Error al cargar pendientes'),
      () => { this.loadingPendientes.set(false); this.reqPendientes = null; }
    );
  }

  cancelEntregas()   { this.reqEntregas?.cancel?.(); }
  cancelSolicitudes(){ this.reqSolicitudes?.cancel?.(); }
  cancelPendientes() { this.reqPendientes?.cancel?.(); }
}
