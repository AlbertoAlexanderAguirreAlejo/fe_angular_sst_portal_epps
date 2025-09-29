// src/app/core/services/notifications/notifications.service.ts
import { Injectable } from '@angular/core';
import { MessageService, ToastMessageOptions } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private messages: MessageService) {}

  private push(msg: ToastMessageOptions) {
    this.messages.add(msg);
  }

  success(summary: string, detail?: string) {
    this.push({ severity: 'success', summary, detail });
  }
  info(summary: string, detail?: string) {
    this.push({ severity: 'info', summary, detail });
  }
  warn(summary: string, detail?: string) {
    this.push({ severity: 'warn', summary, detail });
  }
  error(summary: string, detail?: string) {
    this.push({ severity: 'error', summary, detail });
  }

  clear(key?: string) {
    key ? this.messages.clear(key) : this.messages.clear();
  }
}
