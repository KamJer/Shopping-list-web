import { Injectable, inject } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject } from 'rxjs';
import { TokenService } from './token.service';
import { NotificationService } from './notification';
import { Messages } from '../messages';

export enum Command {
  CONNECT = 'CONNECT',
  CONNECTED = 'CONNECTED',
  MESSAGE = 'MESSAGE',
  SUBSCRIBE = 'SUBSCRIBE',
  SUBSCRIBED = 'SUBSCRIBED',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  ERROR = 'ERROR'
}

export interface WsMessage {
  command: Command;
  headers: {
    ID?: string;
    DEST?: string;
    BODY?: string;
    PARA?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private static readonly RECONNECT_DELAY_MS = 3000;

  private readonly notify = inject(NotificationService);
  private socket$: WebSocketSubject<unknown> | undefined;
  public messages$ = new Subject<any>();
  private token: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private tokenService: TokenService
  ) { }

  setToken(token: string) {
    this.token = token;
  }

  isConnected(): boolean {
    return this.socket$ !== undefined;
  }

  connect() {
    this.disconnect();
    this.clearReconnectTimer();

    if (!this.token) {
      this.token = this.tokenService.getToken();
    }

    if (!this.token) {
      this.notify.show(Messages.connection.connectError, 'error');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws?token=${this.token}`;

    this.socket$ = webSocket({
      url: wsUrl,
      deserializer: msg => msg.data
    });

    this.socket$.subscribe({
      next: msg => {
        this.messages$.next(msg);
      },
      error: () => {
        this.notify.show(Messages.connection.realtimeError, 'error');
        this.socket$ = undefined;
        this.scheduleReconnect();
      },
      complete: () => {
        this.socket$ = undefined;
      }
    });

    const message: WsMessage = {
      command: Command.CONNECT,
      headers: {}
    };
    this.sendMessage(message);
  }

  sendMessage(message: WsMessage) {
    const socket = this.socket$;
    if (!socket) {
      return;
    }
    socket.next(message);
  }

  disconnect() {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    this.clearReconnectTimer();
  }

  /** Prosty reconnect z opóźnieniem; działa tylko gdy sesja wciąż żyje (token w TokenService). */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const freshToken = this.tokenService.getToken();
      if (freshToken) {
        this.token = freshToken;
        this.connect();
      }
    }, WebSocketService.RECONNECT_DELAY_MS);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}