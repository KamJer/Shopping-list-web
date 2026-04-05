import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { TokenService } from '../services/token.service';

/** Wymaga zapisanego access tokena (np. chronione trasy aplikacji). */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  if (token != null && token.length > 0) {
    return true;
  }
  return router.createUrlTree(['/']);
};

/** Strona logowania — jeśli już zalogowany, idź na listę. */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  if (token == null || token.length === 0) {
    return true;
  }
  return router.createUrlTree(['/list']);
};
