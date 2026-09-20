'use client';

import { CookieBanner } from '@kodem/design-system/components/ui/cookie-banner';
import { marketingOrigin } from '../../lib/marketing-origin';

export function AppCookieBanner() {
  const origin = marketingOrigin();
  return (
    <CookieBanner
      privacyHref={`${origin}/privacy`}
      cookiesHref={`${origin}/cookies`}
    />
  );
}
