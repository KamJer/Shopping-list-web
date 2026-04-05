import { Injectable } from '@angular/core';
import { normalizeTokenResponse, TokenDto } from '../models/token-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenStorageKey = 'accessToken';
  private readonly userNameStorageKey = 'userName';

  private userName: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = this.readTokenFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.tokenStorageKey) {
          this.accessToken = e.newValue;
        }
        if (e.key === this.userNameStorageKey) {
          this.userName = e.newValue;
        }
      });
    }
  }

  persistAuthTokens(dto: TokenDto): void {
    const normalized = normalizeTokenResponse(dto) ?? dto;
    if (normalized.accessToken) {
      this.setToken(normalized.accessToken);
    }
  }

  clearAuth(): void {
    this.clearToken();
    this.clearUserName();
  }

  setToken(token: string): void {
    this.accessToken = token;
    this.writeTokenToStorage(token);
  }

  getToken(): string | null {
    const stored = this.readTokenFromStorage();
    if (stored !== this.accessToken) {
      this.accessToken = stored;
    }
    return this.accessToken;
  }

  setUserName(userName: string): void {
    this.userName = userName;
    this.writeUserNameToStorage(userName);
  }

  getUserName(): string | null {
    if (!this.userName) {
      this.userName = this.readUserNameFromStorage();
    }
    return this.userName;
  }

  clearToken(): void {
    this.accessToken = null;
    this.removeTokenFromStorage();
  }

  clearUserName(): void {
    this.userName = null;
    this.removeUserNameFromStorage();
  }

  private readTokenFromStorage(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(this.tokenStorageKey);
  }

  private writeTokenToStorage(token: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(this.tokenStorageKey, token);
  }

  private removeTokenFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.tokenStorageKey);
  }

  private writeUserNameToStorage(userName: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(this.userNameStorageKey, userName);
  }

  private readUserNameFromStorage(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(this.userNameStorageKey);
  }

  private removeUserNameFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.userNameStorageKey);
  }
}
