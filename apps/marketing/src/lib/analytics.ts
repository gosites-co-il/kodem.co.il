import { SITE_CONFIG } from './site-config';

export type AnalyticsEvent =
  | 'hero_cta_click'
  | 'calculator_started'
  | 'calculator_completed'
  | 'lead_form_started'
  | 'lead_form_submitted'
  | 'whatsapp_demo_clicked'
  | 'pricing_cta_clicked'
  | 'faq_opened';

type EventPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Analytics abstraction — no-ops when IDs are unset.
 * Do not hard-code tracking IDs.
 */
export function track(event: AnalyticsEvent, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, payload);
  }

  if (SITE_CONFIG.gaMeasurementId && typeof window.gtag === 'function') {
    window.gtag('event', event, payload);
  }

  if (SITE_CONFIG.metaPixelId && typeof window.fbq === 'function') {
    window.fbq('trackCustom', event, payload);
  }
}
