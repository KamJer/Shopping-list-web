import { describe, it, expect, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { fetchUserRole, runSharedTokenRefresh } from './shared-token-refresh';
import { TokenService } from '../services/token.service';
import { WebSocketService } from '../services/websocket';

function httpStub(routes: Record<string, unknown>): HttpClient {
  return {
    get: (url: string) => {
      if (!(url in routes)) {
        throw new Error(`Unexpected GET ${url}`);
      }
      return of(routes[url]);
    }
  } as unknown as HttpClient;
}

function failingHttp(): HttpClient {
  return {
    get: () => throwError(() => new HttpErrorResponse({ status: 401 }))
  } as unknown as HttpClient;
}

describe('fetchUserRole', () => {
  it('sets userName and role from GET /user', async () => {
    const service = new TokenService();
    await fetchUserRole(
      httpStub({ '/user': { userName: 'kamil', role: 'ADMIN' } }),
      service
    );
    expect(service.getUserName()).toBe('kamil');
    expect(service.getRole()).toBe('ADMIN');
  });

  it('clears only role on error and keeps existing userName', async () => {
    const service = new TokenService();
    service.setUserName('kamil');
    await fetchUserRole(failingHttp(), service);
    expect(service.getRole()).toBeNull();
    expect(service.getUserName()).toBe('kamil');
  });
});

describe('runSharedTokenRefresh', () => {
  it('restores token + userName and does not open WS when socket absent (startup)', async () => {
    const service = new TokenService();
    const ws = {
      setToken: vi.fn(),
      isConnected: () => false,
      disconnect: vi.fn(),
      connect: vi.fn()
    };

    await runSharedTokenRefresh(
      httpStub({
        '/user/refresh': { accessToken: 'tok-1' },
        '/user': { userName: 'kamil', role: 'USER' }
      }),
      service,
      ws as unknown as WebSocketService
    );

    expect(service.getToken()).toBe('tok-1');
    expect(service.getUserName()).toBe('kamil');
    expect(service.getRole()).toBe('USER');
    expect(ws.setToken).toHaveBeenCalledWith('tok-1');
    expect(ws.disconnect).not.toHaveBeenCalled();
    expect(ws.connect).not.toHaveBeenCalled();
  });

  it('reconnects WS when an active socket exists (401 refresh)', async () => {
    const service = new TokenService();
    const ws = {
      setToken: vi.fn(),
      isConnected: () => true,
      disconnect: vi.fn(),
      connect: vi.fn()
    };

    await runSharedTokenRefresh(
      httpStub({
        '/user/refresh': { accessToken: 'tok-1' },
        '/user': { userName: 'kamil', role: 'USER' }
      }),
      service,
      ws as unknown as WebSocketService
    );

    expect(ws.disconnect).toHaveBeenCalled();
    expect(ws.connect).toHaveBeenCalled();
  });

  it('restores profile BEFORE reconnecting the WS', async () => {
    const service = new TokenService();
    let userNameAtConnect: string | null = null;
    const ws = {
      setToken: vi.fn(),
      isConnected: () => true,
      disconnect: vi.fn(),
      connect: () => {
        userNameAtConnect = service.getUserName();
      }
    };

    await runSharedTokenRefresh(
      httpStub({
        '/user/refresh': { accessToken: 'tok-1' },
        '/user': { userName: 'kamil', role: 'USER' }
      }),
      service,
      ws as unknown as WebSocketService
    );

    expect(userNameAtConnect).toBe('kamil');
  });

  it('rejects when refresh fails, then allows a later successful refresh', async () => {
    const service = new TokenService();
    await expect(runSharedTokenRefresh(failingHttp(), service, null)).rejects.toBeTruthy();

    await runSharedTokenRefresh(
      httpStub({
        '/user/refresh': { accessToken: 'tok-2' },
        '/user': { userName: 'kamil', role: 'USER' }
      }),
      service,
      null
    );
    expect(service.getToken()).toBe('tok-2');
  });
});