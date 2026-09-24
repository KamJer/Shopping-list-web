/** Wyciąga `sub` (userName) z payloadu JWT (base64url). Zwraca null dla tokenu nie-JWT
 *  lub niepoprawnego payloadu. Używane jako fallback odtworzenia sesji po reload. */
export function extractUserNameFromJwt(token: string): string | null {
  if (!token || token.indexOf('.') === -1) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const payload = decodeBase64UrlJson(parts[1]);
    const sub = payload['sub'];
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

function decodeBase64UrlJson(part: string): Record<string, unknown> {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad === 0 ? base64 : base64 + '='.repeat(4 - pad);
  const binary = atob(padded);
  const json = decodeURIComponent(
    binary
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json) as Record<string, unknown>;
}