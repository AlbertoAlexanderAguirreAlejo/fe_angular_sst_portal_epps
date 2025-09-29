// src/app/core/interceptors/notify-on-error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { NotificationsService } from '@core/services/notifications/notifications.service';

export const notifyOnErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationsService);
  return next(req).pipe(
    catchError((err: any) => {
      const msg = err?.domainError?.message || err?.error?.message || err?.message || 'Ocurrió un error';
      notify.error(msg);
      return throwError(() => err);
    })
  );
};
