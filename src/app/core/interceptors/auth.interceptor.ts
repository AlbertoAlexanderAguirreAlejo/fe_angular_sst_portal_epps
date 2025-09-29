import { HttpEvent, HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { from, Observable, throwError } from 'rxjs';

const isAuthEndpoint = (url: string) =>
  url.includes('/auth/login') || url.includes('/auth/refresh');

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // No tocar auth endpoints
  if (isAuthEndpoint(req.url)) return next(req);

  // Intento preventivo: si el access expira pronto, renueva antes
  return from(auth.ensureValidToken()).pipe(
    switchMap(() => {
      const token = auth.token;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const withAuth = Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;

      return next(withAuth).pipe(
        catchError((err: HttpErrorResponse) => {
          // Si recibimos 401, probamos una (1) renovación y reintentamos
          if (err.status === 401 && !isAuthEndpoint(withAuth.url)) {
            return from(auth.ensureValidToken()).pipe(
              switchMap((ok) => {
                if (!ok) {
                  auth.logout();
                  router.navigateByUrl('/auth');
                  return throwError(() => err);
                }
                const retried = withAuth.clone({
                  setHeaders: { Authorization: `Bearer ${auth.token!}` }
                });
                return next(retried);
              })
            );
          }
          return throwError(() => err);
        })
      );
    })
  );
};
