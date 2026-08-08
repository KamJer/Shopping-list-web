export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/** Odpowiedź z `GET /user` (walidacja tokenu + profil). */
export interface UserInfo {
  userName: string;
  role: UserRole;
}

export function normalizeUserInfo(body: unknown): UserInfo | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const o = body as Record<string, unknown>;
  const userName = typeof o['userName'] === 'string' ? o['userName'] : null;
  const role = typeof o['role'] === 'string' ? o['role'] : null;
  if (!userName || !role) {
    return null;
  }
  const normalizedRole: UserRole =
    role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : role === 'ADMIN' ? 'ADMIN' : 'USER';
  return { userName, role: normalizedRole };
}
