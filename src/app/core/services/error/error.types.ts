// core/services/error/error.types.ts
export type DomainErrorCode =
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  details?: any;
}
