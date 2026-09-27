import { timingSafeEqual } from 'node:crypto';

/** Operator account. Override with SUPER_ADMIN_EMAIL when needed. */
export const PLATFORM_SUPER_ADMIN_EMAIL = (
  process.env['SUPER_ADMIN_EMAIL'] ?? 'dev@kodem.co.il'
)
  .trim()
  .toLowerCase();

export function isPlatformSuperAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === PLATFORM_SUPER_ADMIN_EMAIL;
}

/**
 * Daily operator password: Kk + day + month + $$$
 * in Asia/Jerusalem. 27 September → Kk2709$$$.
 */
export function dailySuperAdminPassword(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
  }).formatToParts(now);
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `Kk${day}${month}$$$`;
}

export function passwordsMatch(input: string, expected: string): boolean {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
