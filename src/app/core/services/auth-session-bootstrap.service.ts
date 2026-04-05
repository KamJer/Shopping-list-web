import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { runSharedTokenRefresh } from '../auth/shared-token-refresh';
import { TokenService } from './token.service';
import { WebSocketService } from './websocket';

/**
 * Przy starcie aplikacji wywołuje wspólne odświeżenie sesji (GET /user/refresh, withCredentials).
 * Działa także gdy refresh jest tylko w ciasteczku HttpOnly (bez odczytu w JS).
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionBootstrap {
  private readonly http: HttpClient;

  constructor(
    httpBackend: HttpBackend,
    private readonly tokenService: TokenService,
    @Optional() private readonly ws: WebSocketService | null
  ) {
    this.http = new HttpClient(httpBackend);
  }

  refreshOnStartup(): Promise<void> {
    return runSharedTokenRefresh(this.http, this.tokenService, this.ws ?? null).catch((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.tokenService.clearAuth();
      }
    });
  }
}
