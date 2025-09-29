// src/app/core/interceptors/graphql.interceptor.ts
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, of, throwError } from 'rxjs';

export const graphqlInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    mergeMap((event) => {
      if (event instanceof HttpResponse && event.url && event.url.includes('/graphql')) {
        const body = event.body as any;
        if (body?.errors?.length) {
          const message = body.errors.map((e: any) => e?.message).filter(Boolean).join(' • ') || 'Error GraphQL';
          // Lanza HttpErrorResponse 422 para que el resto del pipeline lo maneje
          return throwError(() =>
            new HttpErrorResponse({
              status: 422,
              statusText: 'GraphQL Error',
              url: event.url ?? undefined,
              error: { message, graphqlErrors: body.errors }
            })
          );
        }
      }
      return of(event);
    })
  );
