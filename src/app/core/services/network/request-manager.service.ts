// src/app/core/services/network/request-manager.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export interface Tracked<T> {
  id: string;
  obs$: Observable<T>;
  subscribe(next: (v:T)=>void, error?: (e:any)=>void, complete?:()=>void): Subscription;
  cancel(): void;
}

@Injectable({ providedIn: 'root' })
export class RequestManagerService {
  private subs = new Map<string, Subscription>();

  // Asigna un ID conocido desde el interceptor o pasa uno nuevo
  track<T>(id: string, source$: Observable<T>): Tracked<T> {
    return {
      id,
      obs$: source$,
      subscribe: (next, error, complete) => {
        const sub = source$.subscribe(next, error, complete);
        this.subs.set(id, sub);
        // limpia cuando termine
        const origUnsub = sub.unsubscribe.bind(sub);
        sub.unsubscribe = () => {
          origUnsub();
          this.subs.delete(id);
        };
        return sub;
      },
      cancel: () => {
        this.subs.get(id)?.unsubscribe();
        this.subs.delete(id);
      }
    };
  }

  cancel(id: string) { this.subs.get(id)?.unsubscribe(); }
  cancelAll() { Array.from(this.subs.values()).forEach(s => s.unsubscribe()); this.subs.clear(); }
}
