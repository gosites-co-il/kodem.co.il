'use client';

import { CookieBanner } from '@kodem/design-system/components/ui/cookie-banner';

function marketingPrivacyHref(): string {
  if (typeof window === 'undefined') return 'https://kodem.co.il/privacy';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:4321/privacy';
  }
  if (host.includes('dev.kodem.co.il')) {
    return 'https://dev.kodem.co.il/privacy';
  }
  return 'https://kodem.co.il/privacy';
}

export function AppCookieBanner() {
  return <CookieBanner privacyHref={marketingPrivacyHref()} />;
}
