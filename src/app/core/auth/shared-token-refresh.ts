import { HttpClient, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { normalizeTokenResponse } from '../models/token-dto.model';
import { normalizeUserInfo } from '../models/user-info.model';
import { TokenService } from '../services/token.service';
import { WebSocketService } from '../services/websocket';
import { WITH_CREDENTIALS } from '../http-context-keys';

export const AUTH_REFRESH_PATH = '/user/refresh';

const REFRESH_TIMEOUT_MS = 5000;
const USER_FETCH_TIMEOUT_MS = 5000;

let refreshInFlight: Promise<void> | null = null;

function reconnectWebSocketIfPresent(ws: WebSocketService | null, accessToken: string): void {
  if (!ws) {
    return;
  }
  ws.setToken(accessToken);
  ws.disconnect();
  ws.connect();
}

/** Pobiera `GET /user` i zapisuje rolę w sesji; przy błędzie czyści rolę (nie blokuje logowania). */
export function fetchUserRole(
  http: HttpClient,
  tokenService: TokenService,
  explicitToken?: string
): Promise<void> {
  const headers = explicitToken ? { Authorization: `Bearer ${explicitToken}` } : undefined;
  const context = new HttpContext().set(WITH_CREDENTIALS, true);
  return firstValueFrom(
    http.get<unknown>('/user', headers ? { headers, context } : { context }).pipe(
      timeout(USER_FETCH_TIMEOUT_MS)
    )
  )
    .then(info => {
      const normalized = normalizeUserInfo(info);
      tokenService.setRole(normalized?.role ?? null);
    })
    .catch(() => {
      tokenService.setRole(null);
    });
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
  const context = new HttpContext().set(WITH_CREDENTIALS, true);
  return firstValueFrom(
    http.get<unknown>(AUTH_REFRESH_PATH, { context }).pipe(timeout(REFRESH_TIMEOUT_MS))
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
    return fetchUserRole(http, tokenService, dto.accessToken);
  });
}
