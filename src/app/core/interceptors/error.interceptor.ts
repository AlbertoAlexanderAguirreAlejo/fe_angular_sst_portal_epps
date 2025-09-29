// core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorMapper } from '@core/services/error/error.mapper';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const mapped = ErrorMapper.fromHttp(err);
      // opcional: adjuntar el mapeo para capas superiores
      return throwError(() => Object.assign(err, { domainError: mapped }));
    })
  );
