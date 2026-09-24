import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should return null token initially', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should set and get token', () => {
    service.setToken('test-token-123');
    expect(service.getToken()).toBe('test-token-123');
  });

  it('should clear token', () => {
    service.setToken('test-token-123');
    service.clearToken();
    expect(service.getToken()).toBeNull();
  });

  it('should set and get username', () => {
    service.setUserName('test-user');
    expect(service.getUserName()).toBe('test-user');
  });

  it('should clear username', () => {
    service.setUserName('test-user');
    service.clearUserName();
    expect(service.getUserName()).toBeNull();
  });

  it('should set and get role', () => {
    service.setRole('ADMIN');
    expect(service.getRole()).toBe('ADMIN');
  });

  it('should clear role', () => {
    service.setRole('ADMIN');
    service.clearRole();
    expect(service.getRole()).toBeNull();
  });

  it('should return true for admin role', () => {
    service.setRole('ADMIN');
    expect(service.isAdmin()).toBe(true);
  });

  it('should return true for super admin role', () => {
    service.setRole('SUPER_ADMIN');
    expect(service.isAdmin()).toBe(true);
    expect(service.isSuperAdmin()).toBe(true);
  });

  it('should return false for user role', () => {
    service.setRole('USER');
    expect(service.isAdmin()).toBe(false);
    expect(service.isSuperAdmin()).toBe(false);
  });

  it('should clear all auth data', () => {
    service.setToken('test-token');
    service.setUserName('test-user');
    service.setRole('ADMIN');

    service.clearAuth();

    expect(service.getToken()).toBeNull();
    expect(service.getUserName()).toBeNull();
    expect(service.getRole()).toBeNull();
  });
});
