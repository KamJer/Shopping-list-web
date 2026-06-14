import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationMessage {
  text: string;
  type: 'error' | 'warn' | 'success' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _currentMessage$ = new BehaviorSubject<NotificationMessage | null>(null);
  readonly currentMessage$ = this._currentMessage$.asObservable();

  private autoClearHandle: ReturnType<typeof setTimeout> | null = null;

  show(text: string, type: NotificationMessage['type'] = 'info'): void {
    this.clearAutoClear();
    this._currentMessage$.next({ text, type });
    this.autoClearHandle = setTimeout(() => this.clear(), 5000);
  }

  clear(): void {
    this.clearAutoClear();
    this._currentMessage$.next(null);
  }

  private clearAutoClear(): void {
    if (this.autoClearHandle != null) {
      clearTimeout(this.autoClearHandle);
      this.autoClearHandle = null;
    }
  }
}
