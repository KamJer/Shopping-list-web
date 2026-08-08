import { Injectable } from '@angular/core';
import { normalizeTokenResponse, TokenDto } from '../models/token-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenStorageKey = 'accessToken';
  private readonly userNameStorageKey = 'userName';
  private readonly roleStorageKey = 'role';

  private userName: string | null = null;
  private accessToken: string | null = null;
  private role: string | null = null;

  constructor() {
    this.accessToken = this.readTokenFromStorage();
    this.role = this.readRoleFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.tokenStorageKey) {
          this.accessToken = e.newValue;
        }
        if (e.key === this.userNameStorageKey) {
          this.userName = e.newValue;
        }
        if (e.key === this.roleStorageKey) {
          this.role = e.newValue;
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
    this.clearRole();
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

  setRole(role: string | null): void {
    this.role = role;
    if (role == null || role.length === 0) {
      this.removeRoleFromStorage();
    } else {
      this.writeRoleToStorage(role);
    }
  }

  getRole(): string | null {
    if (!this.role) {
      this.role = this.readRoleFromStorage();
    }
    return this.role;
  }

  isAdmin(): boolean {
    const role = this.getRole();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  isSuperAdmin(): boolean {
    return this.getRole() === 'SUPER_ADMIN';
  }

  clearRole(): void {
    this.role = null;
    this.removeRoleFromStorage();
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

  private writeRoleToStorage(role: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(this.roleStorageKey, role);
  }

  private readRoleFromStorage(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(this.roleStorageKey);
  }

  private removeRoleFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.roleStorageKey);
  }
}
