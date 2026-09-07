import { Response } from 'express';

export const REFRESH_COOKIE = 'kodem_refresh';
export const ACCESS_COOKIE = 'kodem_access';

function refreshMaxAgeSec(): number {
  const raw = process.env['REFRESH_TOKEN_TTL'];
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return Math.floor(n / 1000);
  }
  return 14 * 24 * 60 * 60;
}

function accessMaxAgeSec(): number {
  const raw = process.env['ACCESS_TOKEN_TTL'];
  // ACCESS_TOKEN_TTL may be "15m" — default 15 minutes
  if (raw && /^\d+$/.test(raw)) {
    return Math.floor(Number(raw) / 1000);
  }
  return 15 * 60;
}

function cookieSecure(): boolean {
  if (process.env['COOKIE_SECURE'] === 'true') return true;
  if (process.env['COOKIE_SECURE'] === 'false') return false;
  return process.env['NODE_ENV'] === 'production';
}

function cookieOptions(maxAgeMs?: number) {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax' as const,
    path: '/api/auth',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, cookieOptions(refreshMaxAgeSec() * 1000));
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}

export function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE, token, cookieOptions(accessMaxAgeSec() * 1000));
}

export function clearAccessCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, cookieOptions());
}

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function readCookie(
  req: { headers: { cookie?: string }; cookies?: Record<string, string> },
  name: string,
): string | undefined {
  if (req.cookies?.[name]) return req.cookies[name];
  return parseCookies(req.headers.cookie)[name];
}
