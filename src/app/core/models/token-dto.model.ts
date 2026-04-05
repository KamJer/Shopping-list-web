/** Odpowiedź z `/user/log` i `/user/refresh` (refresh tylko jako HttpOnly cookie — nie zapisujemy w JS). */
export interface TokenDto {
  accessToken: string;
  refreshToken?: string;
}

/** Normalizacja camelCase / snake_case; `refreshToken` w JSON jest ignorowany przy zapisie (cookie). */
export function normalizeTokenResponse(body: unknown): TokenDto | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const o = body as Record<string, unknown>;
  const access = pickNonEmptyString(o, [
    'accessToken',
    'access_token',
    'token',
    'jwt',
    'access'
  ]);
  if (!access) {
    return null;
  }
  const refresh =
    pickNonEmptyString(o, ['refreshToken', 'refresh_token', 'refresh']) ?? undefined;
  return { accessToken: access, ...(refresh ? { refreshToken: refresh } : {}) };
}

function pickNonEmptyString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) {
      return v;
    }
  }
  return null;
}
