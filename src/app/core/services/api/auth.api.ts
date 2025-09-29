import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiUrl } from '@core/config/environment';

export interface LoginResponse {
  token: string;               // accessToken
  refreshToken?: string;       // opcional si tu backend lo devuelve
}
export interface RefreshResponse {
  token: string;               // nuevo accessToken
  refreshToken?: string;       // opcional
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  constructor(private http: HttpClient, @Inject(ApiUrl) private api: string) {}

  login(body: { username: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.api}/auth/login`, body);
  }

  refresh(refreshToken: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${refreshToken}` });
    return this.http.post<RefreshResponse>(`${this.api}/auth/refresh`, null, { headers });
  }
}
