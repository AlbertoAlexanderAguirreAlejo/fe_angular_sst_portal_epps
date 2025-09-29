// core/services/api/graphql.api.ts
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { ApiUrl } from '@core/config/environment';
import { RequestManagerService } from '@core/services/network/request-manager.service';
import { TRACK_LOADING, REQUEST_LABEL, REQUEST_ID } from '@core/services/network/network.tokens';
import { v4 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class GraphQLService {
  constructor(
    private http: HttpClient,
    private rm: RequestManagerService,
    @Inject(ApiUrl) private baseUrl: string
  ) {}

  // Observable normal
  request<TData>(query: string, variables?: Record<string, any>) {
    return this.http.post<{ data: TData; errors?: any[] }>(
      `${this.baseUrl}/graphql`,
      { query, variables }
    );
  }

  // Versión cancelable
  requestCancellable<TData>(query: string, variables?: Record<string, any>, label?: string) {
    const id = uuid();
    const ctx = new HttpContext()
      .set(REQUEST_ID, id)
      .set(TRACK_LOADING, true)
      .set(REQUEST_LABEL, label ?? 'GraphQL');

    const src$ = this.http.post<{ data: TData; errors?: any[] }>(
      `${this.baseUrl}/graphql`,
      { query, variables },
      { context: ctx }
    );

    // El Tracked<T> aquí es T = { data: TData; errors?: ... }
    return this.rm.track(id, src$);
  }
}
