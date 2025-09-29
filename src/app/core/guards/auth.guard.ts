import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

export const isAuthenticated: CanActivateFn = (_r, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token ? true : router.createUrlTree(['/auth'], {
    queryParams: { redirect: state.url }
  });
};

export const canMatchAuthenticated: CanMatchFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token ? true : router.parseUrl('/auth');
};

export const redirectIfAuthenticated: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token ? router.parseUrl('/reports') : true;
};
