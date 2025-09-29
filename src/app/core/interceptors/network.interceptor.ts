// src/app/core/interceptors/network.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { NetworkTrackerService } from '@core/services/network/network-tracker.service';
import { REQUEST_ID, REQUEST_LABEL, TRACK_LOADING } from '@core/services/network/network.tokens';

export const networkInterceptor: HttpInterceptorFn = (req, next) => {
  const tracker = inject(NetworkTrackerService);
  const track = req.context.get(TRACK_LOADING);
  if (!track) return next(req);

  const id = req.context.get(REQUEST_ID) || uuid(); // usa el de contexto si existe
  tracker.start({
    id,
    method: req.method,
    url: req.urlWithParams || req.url,
    label: req.context.get(REQUEST_LABEL),
    startedAt: performance.now(),
  });

  return next(req).pipe(finalize(() => tracker.end(id)));
};
