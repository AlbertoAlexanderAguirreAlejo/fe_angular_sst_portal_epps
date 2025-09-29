// src/app/shared/ui/components/network-indicator/network-indicator.component.ts
import { Component, inject } from '@angular/core';
import { DecimalPipe, NgStyle } from '@angular/common';
import { NetworkTrackerService } from '@core/services/network/network-tracker.service';
import { RequestManagerService } from '@core/services/network/request-manager.service';
import { GradientBorderDirective } from '@shared/ui/directives/gradient-border.directive';

@Component({
  standalone: true,
  selector: 'app-network-indicator',
  imports: [DecimalPipe, NgStyle, GradientBorderDirective],
  template: `
  <div class="fixed bottom-5 right-5 z-[9999] select-none">
    @if (busy()) {
      <div
        appGradientBorder
        [gbWidth]="2"
        [gbSpeed]="'6s'"
        [gbPauseOnHover]="true"
        class="w-[360px] max-w-[92vw]
               backdrop-blur-md
               rounded-2xl shadow-2xl
               transition-all duration-300"
        [class.w-[220px]]="collapsed"
      >
        <!-- Header -->
        <div class="px-4 py-3 flex items-center gap-3">
          <div class="relative flex items-center justify-center">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-30"></circle>
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" class="opacity-80"></path>
            </svg>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold">Cargando</span>
              <span class="px-2 py-0.5 rounded-full text-xs tabular-nums border border-current/20">
                {{ count() }}
              </span>
            </div>
            @if (!collapsed) {
              <p class="text-xs opacity-70">Solicitudes en curso</p>
            }
          </div>

          <div class="flex items-center gap-1">
            <button
              class="px-2 py-1 rounded-lg text-xs transition hover:bg-current/10 text-white dark:text-black bg-red-400"
              (click)="cancelAll()"
              title="Cancelar todas"
            >
              Cancelar todo
            </button>
            <button
              class="px-2 py-1 rounded-lg text-xs transition border border-current/20 hover:bg-current/10"
              (click)="collapsed = !collapsed"
              [attr.aria-expanded]="!collapsed"
              [attr.aria-label]="collapsed ? 'Expandir' : 'Colapsar'"
            >
              {{ collapsed ? 'Mostrar' : 'Ocultar' }}
            </button>
          </div>
        </div>

        <!-- Listado -->
        @if (!collapsed) {
          <ul class="px-2 pb-2 max-h-72 overflow-auto thin-scrollbar space-y-2">
            @for (r of inflight(); track r.id) {
              <li class="rounded-xl transition-colors bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
                <div class="flex items-center gap-2 px-3 pt-2">
                  <!-- Badge método (neutro, hereda color) -->
                  <span class="text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide border border-current/20">
                    {{ r.method }}
                  </span>

                  <span class="truncate max-w-[230px] text-sm opacity-90" [title]="r.label || r.url">
                    {{ r.label || r.url }}
                  </span>

                  <span class="ml-auto text-xs opacity-70 tabular-nums">
                    {{ (r.elapsedMs/1000) | number:'1.1-1' }}s
                  </span>

                  <button
                    class="ml-1 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-current/10 text-white dark:text-black bg-red-400"
                    (click)="cancel(r.id)"
                    title="Cancelar esta petición"
                  >
                    Cancelar
                  </button>
                </div>

                <!-- Barra tiempo transcurrido (0–10s) -->
                <div class="px-3 pb-2">
                  <div class="h-1 w-full rounded-full overflow-hidden bg-black/[0.08] dark:bg-white/[0.12]">
                    <div class="h-full rounded-full"
                         [ngStyle]="{ width: progress(r.elapsedMs) + '%',
                                      background: 'linear-gradient(90deg, var(--ni-bar-a, currentColor) 0%, var(--ni-bar-b, currentColor) 100%)' }">
                    </div>
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    }
  </div>
  `,
})
export class NetworkIndicatorComponent {
  tracker = inject(NetworkTrackerService);
  rm = inject(RequestManagerService);

  inflight = this.tracker.inFlight;
  count = this.tracker.activeCount;
  busy = this.tracker.busy;

  collapsed = false;

  cancel(id: string) { this.rm.cancel(id); }
  cancelAll() { this.rm.cancelAll(); }

  // 0–10s → 0–100%
  progress(ms: number): number {
    const pct = (ms / 10000) * 100;
    return Math.max(2, Math.min(100, Math.round(pct)));
  }
}
