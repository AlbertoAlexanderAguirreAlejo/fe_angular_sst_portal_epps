// src/app/core/services/network/network-tracker.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

export interface InFlight {
  id: string;
  method: string;
  url: string;
  label?: string | null;
  startedAt: number; // performance.now()
  elapsedMs: number; // se actualiza
}

@Injectable({ providedIn: 'root' })
export class NetworkTrackerService {
  private _map = new Map<string, InFlight>();
  private _tick = signal(0);

  // actualiza elapsed cada 200ms
  constructor() {
    const i = setInterval(() => this._tick.update(n => n + 1), 100);
    // si quieres: limpiar al destruir app (no suele aplicar en SPA)
  }

  start(item: Omit<InFlight, 'elapsedMs'>) {
    this._map.set(item.id, { ...item, elapsedMs: 0 });
  }
  end(id: string) {
    this._map.delete(id);
  }

  // Derivados
  inFlight = computed<InFlight[]>(() => {
    // rehace el arreglo para refrescar elapsed con _tick()
    this._tick(); // dependencia
    const now = performance.now();
    return Array.from(this._map.values()).map(r => ({
      ...r,
      elapsedMs: Math.max(0, now - r.startedAt),
    }));
  });

  activeCount = computed(() => this.inFlight().length);
  busy = computed(() => this.activeCount() > 0);
}
