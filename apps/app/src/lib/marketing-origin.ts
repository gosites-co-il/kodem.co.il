/**
 * Marketing site origin for the current environment.
 *
 * Priority:
 * 1. `NEXT_PUBLIC_MARKETING_URL` (baked per deploy / local `.env`)
 * 2. Browser hostname heuristics
 * 3. `NODE_ENV === 'development'` → local marketing
 * 4. Production marketing homepage
 */
export function marketingOrigin(): string {
  const fromEnv = process.env['NEXT_PUBLIC_MARKETING_URL']?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4321';
    }
    // app.dev.kodem.co.il, *.dev.kodem.co.il, dev.kodem.co.il
    if (
      host === 'dev.kodem.co.il' ||
      host.endsWith('.dev.kodem.co.il')
    ) {
      return 'https://dev.kodem.co.il';
    }
    // app.kodem.co.il and other prod hosts
    if (host === 'kodem.co.il' || host.endsWith('.kodem.co.il')) {
      return 'https://kodem.co.il';
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:4321';
  }

  return 'https://kodem.co.il';
}

export function marketingLegalHref(
  path: '/terms' | '/privacy' | '/cookies' | '/ai-terms',
): string {
  return `${marketingOrigin()}${path}`;
}

/**
 * Safe return URL for guest exit — only same marketing origin (or its homepage).
 */
export function resolveMarketingReturnUrl(candidate?: string | null): string {
  const origin = marketingOrigin().replace(/\/$/, '');
  if (!candidate?.trim()) return origin;

  try {
    const url = new URL(candidate.trim());
    const allowed = new URL(origin);
    if (url.origin !== allowed.origin) return origin;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return origin;
    return url.toString();
  } catch {
    if (candidate.startsWith('/') && !candidate.startsWith('//')) {
      return `${origin}${candidate}`;
    }
    return origin;
  }
}
