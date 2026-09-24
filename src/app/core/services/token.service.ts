import { Injectable } from '@angular/core';
import { normalizeTokenResponse, TokenDto } from '../models/token-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private userName: string | null = null;
  private accessToken: string | null = null;
  private role: string | null = null;

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
  }

  getToken(): string | null {
    return this.accessToken;
  }

  setUserName(userName: string): void {
    this.userName = userName;
  }

  getUserName(): string | null {
    return this.userName;
  }

  clearToken(): void {
    this.accessToken = null;
  }

  clearUserName(): void {
    this.userName = null;
  }

  setRole(role: string | null): void {
    this.role = role;
  }

  getRole(): string | null {
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
  }
}
