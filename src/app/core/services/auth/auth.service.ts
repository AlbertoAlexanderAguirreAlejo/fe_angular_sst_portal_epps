import { Injectable, computed, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { AuthApi, LoginResponse, RefreshResponse } from '@core/services/api/auth.api';
import { ViewCacheService } from '@core/services/cache/view-cache.service';

type Decoded = { exp?: number; codUser?: string; [k: string]: any };

function read(key: string) { return localStorage.getItem(key); }
function write(key: string, val: string | null) {
  if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSig        = signal<string | null>(read('authToken'));
  private refreshTokenSig = signal<string | null>(read('refreshToken'));
  private refreshingOnce: Promise<boolean> | null = null;

  user = computed<Decoded | null>(() => {
    const t = this.tokenSig();
    if (!t) return null;
    try { return jwtDecode<Decoded>(t); } catch { return null; }
  });

  constructor(private api: AuthApi, private cache: ViewCacheService) {}

  // === helpers de expiración ===
  private nowSec() { return Math.floor(Date.now() / 1000); }
  isExpired(t: string | null) {
    if (!t) return true;
    try { const d = jwtDecode<Decoded>(t); return !!d.exp && d.exp <= this.nowSec(); }
    catch { return true; }
  }
  willExpireSoon(t: string | null, skewSec = 60) {
    if (!t) return true;
    try { const d = jwtDecode<Decoded>(t); return !!d.exp && d.exp <= (this.nowSec() + skewSec); }
    catch { return true; }
  }

  // === API pública ===
  async login(username: string, password: string) {
    const res = await firstValueFrom(this.api.login({ username, password }));
    if (!res?.token) throw new Error('Token vacío');
    this.setTokens(res);
  }

  logout() {
    write('authToken', null);
    write('refreshToken', null);
    this.tokenSig.set(null);
    this.refreshTokenSig.set(null);
    this.cache.clearAll();
  }

  get token(): string | null { return this.tokenSig(); }
  get refreshToken(): string | null { return this.refreshTokenSig(); }

  // === refresh controlado (una vez por ráfaga) ===
  async ensureValidToken(): Promise<boolean> {
    const access = this.token;
    // Si no expira pronto, ok.
    if (!this.willExpireSoon(access)) return true;
    // Si no hay refresh, no podemos renovar.
    const rt = this.refreshToken;
    if (!rt) return false;
    // Evita múltiples llamados simultáneos.
    if (!this.refreshingOnce) {
      this.refreshingOnce = firstValueFrom(this.api.refresh(rt))
        .then((r) => { this.setTokens(r); return true; })
        .catch(() => { this.logout(); return false; })
        .finally(() => { this.refreshingOnce = null; });
    }
    return this.refreshingOnce;
  }

  // === set persistente ===
  private setTokens(r: LoginResponse | RefreshResponse) {
    write('authToken', r.token);
    this.tokenSig.set(r.token);
    if (r.refreshToken) {
      write('refreshToken', r.refreshToken);
      this.refreshTokenSig.set(r.refreshToken);
    }
  }
}
