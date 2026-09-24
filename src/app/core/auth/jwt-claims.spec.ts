import { describe, it, expect } from 'vitest';
import { extractUserNameFromJwt } from './jwt-claims';

function base64Url(o: unknown): string {
  return btoa(JSON.stringify(o))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.signature`;
}

describe('extractUserNameFromJwt', () => {
  it('extracts sub from a valid JWT payload', () => {
    expect(extractUserNameFromJwt(makeJwt({ sub: 'kamil', exp: 123456 }))).toBe('kamil');
  });

  it('round-trips base64url special characters (- and _)', () => {
    expect(extractUserNameFromJwt(makeJwt({ sub: 'user+with/slash' }))).toBe('user+with/slash');
  });

  it('returns null for a non-JWT token without dots', () => {
    expect(extractUserNameFromJwt('plain-token')).toBeNull();
  });

  it('returns null for an invalid payload part', () => {
    expect(extractUserNameFromJwt('aaa.bbb.ccc')).toBeNull();
  });

  it('returns null when sub claim is missing', () => {
    expect(extractUserNameFromJwt(makeJwt({ exp: 123 }))).toBeNull();
  });

  it('returns null when sub is empty', () => {
    expect(extractUserNameFromJwt(makeJwt({ sub: '', exp: 123 }))).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(extractUserNameFromJwt('')).toBeNull();
  });

  it('returns null when only one dot present (2 parts, second invalid)', () => {
    expect(extractUserNameFromJwt('abc.')).toBeNull();
  });
});