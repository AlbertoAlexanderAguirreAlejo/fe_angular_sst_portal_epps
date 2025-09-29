// src/app/core/services/error/global-error.handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorMapper } from './error.mapper';
import { NotificationsService } from '@core/services/notifications/notifications.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notifier = inject(NotificationsService);

  handleError(error: any) {
    const mapped = ErrorMapper.fromUnknown(error);
    this.notifier.error(mapped.message); // muestra toast
    console.error('[GlobalErrorHandler]', mapped);
  }
}
