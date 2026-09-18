export const COOKIE_CONSENT_NAME = 'kodem_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year
export const COOKIE_CONSENT_CHANGED_EVENT = 'kodem:cookie-consent-changed';
export const COOKIE_CONSENT_OPEN_EVENT = 'kodem:cookie-consent-open';

export type CookieConsentCategories = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsent = CookieConsentCategories & {
  v: typeof COOKIE_CONSENT_VERSION;
  ts: number;
};

const DEFAULT_REJECTED: CookieConsentCategories = {
  essential: true,
  analytics: false,
  marketing: false,
};

const DEFAULT_ACCEPTED: CookieConsentCategories = {
  essential: true,
  analytics: true,
  marketing: true,
};

/** Parent domain so marketing + app share one decision (e.g. `.kodem.co.il`). */
export function getConsentCookieDomain(hostname = getHostname()): string | undefined {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return undefined;
  }
  if (hostname === 'kodem.co.il' || hostname.endsWith('.kodem.co.il')) {
    return '.kodem.co.il';
  }
  return undefined;
}

function getHostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

function readRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.v !== COOKIE_CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') {
      return null;
    }
    return {
      v: COOKIE_CONSENT_VERSION,
      essential: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      ts: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
    };
  } catch {
    return null;
  }
}

export function readCookieConsent(): CookieConsent | null {
  return parseConsent(readRawCookie(COOKIE_CONSENT_NAME));
}

export function hasCookieConsentDecision(): boolean {
  return readCookieConsent() !== null;
}

export function writeCookieConsent(categories: CookieConsentCategories): CookieConsent {
  const consent: CookieConsent = {
    v: COOKIE_CONSENT_VERSION,
    essential: true,
    analytics: categories.analytics,
    marketing: categories.marketing,
    ts: Date.now(),
  };

  if (typeof document !== 'undefined') {
    const domain = getConsentCookieDomain();
    const parts = [
      `${COOKIE_CONSENT_NAME}=${encodeURIComponent(JSON.stringify(consent))}`,
      'path=/',
      `max-age=${COOKIE_CONSENT_MAX_AGE_SEC}`,
      'SameSite=Lax',
    ];
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      parts.push('Secure');
    }
    if (domain) {
      parts.push(`Domain=${domain}`);
    }
    document.cookie = parts.join('; ');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: consent }),
    );
  }

  return consent;
}

export function acceptAllCookieConsent(): CookieConsent {
  return writeCookieConsent(DEFAULT_ACCEPTED);
}

export function rejectNonEssentialCookieConsent(): CookieConsent {
  return writeCookieConsent(DEFAULT_REJECTED);
}

export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

export function canUseAnalytics(consent: CookieConsent | null = readCookieConsent()): boolean {
  return consent?.analytics === true;
}

export function canUseMarketing(consent: CookieConsent | null = readCookieConsent()): boolean {
  return consent?.marketing === true;
}
