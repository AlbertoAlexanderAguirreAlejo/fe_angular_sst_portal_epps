// core/services/storage/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, def: T): T {
    try { return JSON.parse(localStorage.getItem(key) || '') as T; }
    catch { return def; }
  }
  set<T>(key: string, val: T) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  remove(key: string) { localStorage.removeItem(key); }
}
