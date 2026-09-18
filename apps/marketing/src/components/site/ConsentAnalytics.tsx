'use client';

import { useEffect, useState } from 'react';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  canUseAnalytics,
  canUseMarketing,
  readCookieConsent,
  type CookieConsent,
} from '@kodem/design-system/lib/cookie-consent';
import { SITE_CONFIG } from '../../lib/site-config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

function loadGoogleAnalytics(measurementId: string) {
  if (document.getElementById('kodem-ga-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.id = 'kodem-ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId: string) {
  if (document.getElementById('kodem-meta-pixel')) return;

  const n = function (...args: unknown[]) {
    const fn = n as typeof n & {
      callMethod?: (...a: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
    };
    if (fn.callMethod) {
      fn.callMethod(...args);
    } else {
      fn.queue.push(args);
    }
  } as ((...args: unknown[]) => void) & {
    callMethod?: (...a: unknown[]) => void;
    queue: unknown[];
    loaded: boolean;
    version: string;
  };
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  window.fbq = n;

  const script = document.createElement('script');
  script.id = 'kodem-meta-pixel';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

/**
 * Loads marketing analytics only after cookie consent allows it.
 */
export function ConsentAnalytics() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      setConsent(detail ?? readCookieConsent());
    };
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (canUseAnalytics(consent) && SITE_CONFIG.gaMeasurementId) {
      loadGoogleAnalytics(SITE_CONFIG.gaMeasurementId);
    }
    if (canUseMarketing(consent) && SITE_CONFIG.metaPixelId) {
      loadMetaPixel(SITE_CONFIG.metaPixelId);
    }
  }, [consent]);

  return null;
}
