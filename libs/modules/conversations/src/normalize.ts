/** Same Israeli rule as the marketing lead form: 050… and +972… are one number. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 9) {
    return `+972${digits.slice(1)}`;
  }
  return hasPlus || digits.length > 9 ? `+${digits}` : digits;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function extractEmailAddress(raw: string): string {
  const trimmed = raw.trim();
  const wrapped = trimmed.match(/<([^>]+)>/);
  return normalizeEmail(wrapped?.[1] ?? trimmed);
}

export const CONTACT_PLACEHOLDER_NAME = 'איש קשר';
