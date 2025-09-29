// core/services/error/error.mapper.ts
import { HttpErrorResponse } from '@angular/common/http';
import { DomainError } from './error.types';

export class ErrorMapper {
  static fromHttp(err: HttpErrorResponse): DomainError {
    if (err.status === 0)          return { code: 'NETWORK', message: 'Conexión no disponible' };
    if (err.status === 401)        return { code: 'AUTH_UNAUTHORIZED', message: 'Sesión expirada o inválida' };
    if (err.status === 403)        return { code: 'AUTH_FORBIDDEN', message: 'Sin permisos' };
    if (err.status === 404)        return { code: 'NOT_FOUND', message: 'Recurso no encontrado' };
    if (err.status === 422)        return { code: 'VALIDATION', message: this.msg(err) , details: err.error };
    return { code: 'UNKNOWN', message: this.msg(err), details: err.error };
  }
  static fromUnknown(err: any): DomainError {
    if (err instanceof HttpErrorResponse) return this.fromHttp(err);
    return { code: 'UNKNOWN', message: err?.message || 'Error desconocido', details: err };
  }
  private static msg(err: HttpErrorResponse) {
    return err.error?.message || err.statusText || `Error ${err.status}`;
  }
}
