import { Injectable, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject } from 'rxjs';
import { TokenService } from './token.service';

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

  private socket$: WebSocketSubject<unknown> | undefined;
  public messages$ = new Subject<any>();
  private token: string | null = null;

  constructor(
    private tokenService: TokenService,
    private ngZone: NgZone
  ) { }

  setToken(token: string) {
    this.token = token;
  }

  connect() {
    this.disconnect();

    if (!this.token) {
      this.token = this.tokenService.getToken();
    }

    if (!this.token) {
      console.error("Brak tokena! Nie można połączyć się z WebSocket.");
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
        // WebSocket callbacks may run outside Angular zone; UI that depends on messages won't update otherwise.
        this.ngZone.run(() => this.messages$.next(msg));
      },
      error: err => console.error('WebSocket error:', err)
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
      console.error("WebSocket nie jest połączony");
      return;
    }
    socket.next(message);
  }

  disconnect() {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }
}