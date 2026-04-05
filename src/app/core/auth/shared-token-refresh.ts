import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeTokenResponse } from '../models/token-dto.model';
import { TokenService } from '../services/token.service';
import { WebSocketService } from '../services/websocket';

export const AUTH_REFRESH_PATH = '/user/refresh';

let refreshInFlight: Promise<void> | null = null;

function reconnectWebSocketIfPresent(ws: WebSocketService | null, accessToken: string): void {
  if (!ws) {
    return;
  }
  ws.setToken(accessToken);
  ws.disconnect();
  ws.connect();
}

export function runSharedTokenRefresh(
  http: HttpClient,
  tokenService: TokenService,
  ws: WebSocketService | null
): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = executeRefresh(http, tokenService, ws).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function executeRefresh(
  http: HttpClient,
  tokenService: TokenService,
  ws: WebSocketService | null
): Promise<void> {
  return firstValueFrom(
    http.get<unknown>(AUTH_REFRESH_PATH, {
      withCredentials: true
    })
  ).then(raw => {
    const dto = normalizeTokenResponse(raw);
    if (!dto?.accessToken) {
      throw new HttpErrorResponse({
        status: 401,
        statusText: 'Brak access token w odpowiedzi /user/refresh'
      });
    }
    tokenService.persistAuthTokens(dto);
    reconnectWebSocketIfPresent(ws, dto.accessToken);
  });
}
