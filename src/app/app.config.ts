// src/app/app.config.ts
import {
  ApplicationConfig,
  ErrorHandler,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  inject,
  NgZone,
} from '@angular/core';
import {
  provideRouter,
  Router,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';

import { BrandTheme } from '@core/theme/brand-theme';
import { ThemeService } from '@core/theme/theme.service';

import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

import { AuthService } from '@core/services/auth/auth.service';
import { GlobalErrorHandler } from '@core/services/error/global-error.handler';

import { APP_LOGOUT } from '@core/tokens/app-logout.token';
import { CUSTOM_ROUTE_REUSE_PROVIDER } from '@core/providers/route-reuse.provider';
import { networkInterceptor } from '@core/interceptors/network.interceptor';
import { notifyOnErrorInterceptor } from '@core/interceptors/notify-on-error.interceptor';
import { graphqlInterceptor } from '@core/interceptors/graphql.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // --- Núcleo / rendimiento
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),

    // --- Router
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withPreloading(PreloadAllModules)
    ),

    // --- HTTP
    // Orden importante:
    // - Requests: error -> auth
    // - Responses: auth -> error
    // Así auth maneja 401/refresh antes de que error envuelva el HttpErrorResponse.
    provideHttpClient(
      withFetch(),
      withInterceptors([notifyOnErrorInterceptor, networkInterceptor, graphqlInterceptor, networkInterceptor, errorInterceptor, authInterceptor])
    ),

    // --- Manejo global de errores
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // --- PrimeNG
    MessageService,
    providePrimeNG({
      theme: {
        preset: BrandTheme,
        options: { darkModeSelector: '.dark', locale: 'es' },
      },
      ripple: true,
    }),

    // --- Estrategias/proveedores de plataforma
    CUSTOM_ROUTE_REUSE_PROVIDER,

    // --- Inicialización de tema antes del render inicial
    provideAppInitializer(() => {
      const theme = inject(ThemeService);
      theme.init({ useSystemOnFirstLoad: false });
    }),

    // --- Acción de logout global reusable
    {
      provide: APP_LOGOUT,
      useFactory: () => {
        const auth = inject(AuthService);
        const router = inject(Router);
        const zone = inject(NgZone);
        return () =>
          zone.run(() => {
            auth.logout();
            router.navigateByUrl('/auth');
          });
      },
    },
  ],
};
