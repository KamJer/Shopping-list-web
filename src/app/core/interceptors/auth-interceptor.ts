import {
  HttpBackend,
  HttpClient,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AUTH_REFRESH_PATH, runSharedTokenRefresh } from '../auth/shared-token-refresh';
import { TokenService } from '../services/token.service';
import { WebSocketService } from '../services/websocket';

/** Zapobiega pętli: jedno ponowienie żądania po udanym `/user/refresh`. */
export const AUTH_RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

function requestUrlLower(req: HttpRequest<unknown>): string {
  try {
    return new URL(req.url, 'http://local.invalid').pathname.toLowerCase();
  } catch {
    return req.url.toLowerCase();
  }
}

function normalizedPathname(req: HttpRequest<unknown>): string {
  const path = requestUrlLower(req);
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

/** Nie próbujemy odświeżać przy 401 z logowania, rejestracji ani samego refresh. */
function shouldSkip401Refresh(req: HttpRequest<unknown>): boolean {
  const path = normalizedPathname(req);
  return (
    path === AUTH_REFRESH_PATH ||
    path.endsWith('/user/log') ||
    path.endsWith('/user/register')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const http = new HttpClient(inject(HttpBackend));
  const ws = inject(WebSocketService, { optional: true });

  const token = tokenService.getToken();

  const authReq =
    token != null && token.length > 0
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }
      if (req.context.get(AUTH_RETRIED_AFTER_REFRESH)) {
        return throwError(() => err);
      }
      if (shouldSkip401Refresh(req)) {
        return throwError(() => err);
      }

      return from(runSharedTokenRefresh(http, tokenService, ws ?? null)).pipe(
        switchMap(() => {
          const newToken = tokenService.getToken();
          if (!newToken) {
            return throwError(() => err);
          }
          const retry = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            },
            context: req.context.set(AUTH_RETRIED_AFTER_REFRESH, true)
          });
          return next(retry);
        }),
        catchError(refreshErr => {
          tokenService.clearAuth();
          void router.navigateByUrl('/');
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
