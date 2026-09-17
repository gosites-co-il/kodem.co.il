import { SITE_CONFIG } from './site-config';

export type LeadPayload = {
  name: string;
  phone: string;
  source: 'loss_calculator';
  calculatorMonthlyLossIls?: number;
};

export type LeadSubmitResult =
  | { ok: true }
  | { ok: false; error: 'validation' | 'network' | 'server' | 'not_configured' };

/** Normalize Israeli / international phone to digits with optional leading +. */
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

export function isValidIsraeliPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return /^05\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits);
}

/**
 * Lead capture integration.
 * TODO: Wire to a real marketing lead / WhatsApp demo endpoint when available.
 * Today there is no public lead API in apps/api — we only POST if
 * PUBLIC_LEAD_ENDPOINT is set.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadSubmitResult> {
  const name = payload.name.trim();
  const phone = normalizePhone(payload.phone);

  if (!name || !isValidIsraeliPhone(payload.phone)) {
    return { ok: false, error: 'validation' };
  }

  const endpoint =
    (import.meta.env.PUBLIC_LEAD_ENDPOINT as string | undefined)?.trim() ||
    `${SITE_CONFIG.apiUrl}/marketing/leads`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        source: payload.source,
        calculatorMonthlyLossIls: payload.calculatorMonthlyLossIls,
      }),
    });

    if (res.status === 404) {
      // Endpoint not implemented yet — surface clearly, do not fake WhatsApp send.
      return { ok: false, error: 'not_configured' };
    }

    if (!res.ok) {
      return { ok: false, error: 'server' };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}
