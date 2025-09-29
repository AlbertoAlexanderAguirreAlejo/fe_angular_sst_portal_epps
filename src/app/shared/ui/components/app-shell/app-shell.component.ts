// src/app/shared/ui/components/app-shell.component.ts
import {
  Component, ChangeDetectionStrategy, HostListener, inject, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';

// PrimeNG (móvil)
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

// Botón de tema icon-only
import { ThemeToggleIconComponent } from '../theme-toggle-icon.component';

// Logout (tu token)
import { APP_LOGOUT } from '@core/tokens/app-logout.token';
import { DEFAULT_NAV } from './default-nav'
import { NetworkIndicatorComponent } from "../network-indicator.component";

export interface AppNavItem {
  label: string;
  icon?: string;             // ej: 'pi pi-table'
  routerLink?: any[] | string;
  exact?: boolean;           // default true
}
export interface AppNavSection {
  label: string;
  items: AppNavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, DrawerModule, ButtonModule, RippleModule, ThemeToggleIconComponent, ToastModule, NetworkIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { --rail-w: 56px; --panel-w: 260px; }

    /* Sidebar único colapsable */
    .sidebar {
      position: fixed; left: 0; top: 0; height: 100vh; z-index: 1100;
      width: var(--rail-w);
      transition: width .3s ease;
    }
    .sidebar.open { width: var(--panel-w); }

    .link { border-radius: 12px; }
    .link-active {
      background-color: color-mix(in oklab, var(--p-primary-color), transparent 85%);
      color: var(--p-primary-color);
    }

    /* Ocultar textos cuando está colapsado */
    .label, .section-title { transition: opacity .2s ease, margin .2s ease; white-space: nowrap; }
    .sidebar:not(.open) .label { opacity: 0; margin-left: -8px; pointer-events: none; }
    .sidebar:not(.open) .section-title { opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; }

    /* Contenido - CRÍTICO: usar flexbox para que los hijos puedan expandirse */
    .content {
      transition: margin-left .3s ease;
      display: flex;
      flex-direction: column;
      min-height: 0; /* Permite que flexbox funcione correctamente */
    }
  `],
  template: `
    <!-- Indicador de red + Toasts -->
    <app-network-indicator/>
    <!-- FAB móvil (se renderiza SOLO en móvil) -->
     @if(!isDesktop) {
       <button type="button"
               class="fixed top-3 left-3 z-[1200] p-button p-button-rounded p-button-text"
               pButton icon="pi pi-bars"
               (click)="mobileDrawer = true">
       </button>
     }

    <!-- SIDEBAR ÚNICO (desktop) -->
    <aside class="hidden md:flex sidebar flex-col
                  shadow-xl shadow-slate-300 dark:shadow-black"
           [class.open]="isOpen"
           (mouseenter)="hovering = true"
           (mouseleave)="hovering = false">

      <!-- Header -->
      <div class="h-14 px-3 flex items-center justify-between">
        <div class="inline-flex items-center gap-2">
          <img src="assets/logo.jpeg" alt="logo" class="h-7 w-7 rounded-md">
          <span class="label font-semibold text-lg">{{ brand }}</span>
        </div>
        <button type="button" pButton pRipple class="p-button-rounded p-button-text"
                [icon]="'pi pi-thumbtack'"
                [ngStyle]="{ transform: pinned ? 'rotate(45deg)' : 'none' }"
                (click)="togglePin()" [title]="pinned ? 'Desfijar' : 'Fijar'">
        </button>
      </div>

      <!-- NAV (scrollable) -->
      <nav class="flex-1 overflow-y-auto px-2 pb-2">
        <ul>
          @for(section of nav; track section.label) {
            <li>
              <div class="section-title px-2 py-1 text-[11px] font-semibold tracking-wide">
                {{ section.label }}
              </div>
              <ul class="list-none p-0 m-0 space-y-1 mt-1">
                @for (it of section.items; track it.label) {
                  <li>
                    <a pRipple
                       class="link flex items-center px-3 py-2 transition-colors"
                       [class.gap-0]="!isOpen" [class.gap-3]="isOpen"
                       [routerLink]="it.routerLink"
                       [routerLinkActive]="'link-active'"
                       [routerLinkActiveOptions]="{ exact: it.exact !== false }"
                       [title]="!isOpen ? it.label : null" [attr.aria-label]="!isOpen ? it.label : null">
                       @if(it.icon) {
                         <i [class]="it.icon"></i>
                       }
                      <span class="label truncate">{{ it.label }}</span>
                    </a>
                  </li>
                }
              </ul>
            </li>
          }
        </ul>
      </nav>

      <!-- Footer fijo abajo -->
      <div class="px-2 pb-3 w-full">
        <app-theme-toggle-icon/>
      </div>
      <div class="px-2 pb-3 w-full">
        <button type="button"
                pButton
                pRipple
                class="link w-full flex items-center"
                severity="danger"
                (click)="logout()">
          <i class="pi pi-sign-out"></i>
          <span class="label truncate ml-3">Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- MOBILE DRAWER -->
    <p-drawer class="md:!hidden"
              [(visible)]="mobileDrawer"
              position="left"
              [modal]="true"
              [dismissible]="true"
              [blockScroll]="true"
              [baseZIndex]="1500"
              styleClass="!w-72">
      <ng-template #headless>
        <div class="flex flex-col h-full">
          <div class="h-14 px-4 flex items-center justify-between">
            <div class="inline-flex items-center gap-2">
              <img src="assets/logo.jpeg" alt="logo" class="h-7 w-7 rounded-md">
              <span class="font-semibold text-lg">{{ brand }}</span>
            </div>
            <button pButton type="button" icon="pi pi-times"
                    (click)="mobileDrawer=false" rounded outlined class="h-8 w-8"></button>
          </div>

          <nav class="flex-1 px-3 pb-2 overflow-y-auto">
            <ul class="list-none p-0 m-0 space-y-4">
              @for(section of nav; track section.label) {
                <li>
                  <div class="px-2 py-1 text-[11px] font-semibold tracking-wide">
                    {{ section.label }}
                  </div>
                  <ul class="list-none p-0 m-0 space-y-1 mt-1">
                    @for(it of section.items; track it.label) {
                      <li>
                        <a pRipple
                          class="link flex items-center gap-3 px-3 py-2 transition-colors"
                          [routerLink]="it.routerLink"
                          [routerLinkActive]="'link-active'"
                          [routerLinkActiveOptions]="{ exact: it.exact !== false }"
                          (click)="mobileDrawer=false">
                          @if(it.icon) {
                            <i [class]="it.icon"></i>
                          }
                          <span class="truncate">{{ it.label }}</span>
                        </a>
                      </li>
                    }
                  </ul>
                </li>
              }
            </ul>
          </nav>

          <!-- Footer móvil -->
          <div class="px-2 pb-3 mt-auto w-full flex items-center justify-between">
            <app-theme-toggle-icon/>
            <button type="button" pButton pRipple icon="pi pi-sign-out" label="Salir"
                    class="p-button-text"
                    (click)="logout(); mobileDrawer=false"></button>
          </div>
        </div>
      </ng-template>
    </p-drawer>

    <!-- CONTENIDO - CRÍTICO: Usar flex para que los hijos puedan expandirse -->
    <main class="content px-5 h-dvh bg-indigo-50 dark:bg-neutral-950 overflow-hidden"
          [style.margin-left.px]="contentMarginLeft">
      <router-outlet />
    </main>
  `
})
export class AppShellComponent {
  @Input() brand = 'Portal EPPs';
  @Input() nav: AppNavSection[] = DEFAULT_NAV;

  // Estado
  pinned = this.restorePin();
  hovering = false;
  mobileDrawer = false;

  // Layout
  readonly railW = 56;
  readonly panelW = 260;

  get isOpen() { return this.pinned || this.hovering; }
  get isDesktop() { return window.innerWidth >= 768; }
  get contentMarginLeft() {
    if (!this.isDesktop) return 0;
    return this.isOpen ? this.panelW : this.railW;
  }

  // Logout
  private appLogout = inject(APP_LOGOUT);
  logout() { this.appLogout(); }

  togglePin() {
    this.pinned = !this.pinned;
    localStorage.setItem('appShellPinned', this.pinned ? '1' : '0');
  }
  restorePin(): boolean {
    return localStorage.getItem('appShellPinned') === '1';
  }

  // Redibuja en resize (OnPush)
  @HostListener('window:resize')
  onResize() {}
}
