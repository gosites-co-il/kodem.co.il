export const SITE_CONFIG = {
  name: 'KODEM',
  locale: 'he-IL',
  currency: 'ILS',
  /** Set via PUBLIC_WHATSAPP_PHONE (digits only, country code included). */
  whatsappPhone: (import.meta.env.PUBLIC_WHATSAPP_PHONE as string | undefined)?.replace(
    /\D/g,
    '',
  ) ?? '',
  apiUrl: (import.meta.env.PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3333/api',
  siteUrl: (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://kodem.co.il',
  appSignupBase:
    (import.meta.env.PUBLIC_APP_SIGNUP_URL as string | undefined) ?? '/signup',
  gaMeasurementId: (import.meta.env.PUBLIC_GA_MEASUREMENT_ID as string | undefined) ?? '',
  metaPixelId: (import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined) ?? '',
  /**
   * Launch urgency line — only shown when limit > 0.
   * Keep at 0 until a real launch cap exists.
   */
  launchSlotLimit: 0,
} as const;

export function getWhatsAppUrl(prefill?: string): string | null {
  if (!SITE_CONFIG.whatsappPhone) return null;
  const base = `https://wa.me/${SITE_CONFIG.whatsappPhone}`;
  if (!prefill) return base;
  return `${base}?text=${encodeURIComponent(prefill)}`;
}

export const PRIMARY_CTA_LABEL = 'בדוק כמה אתה מפסיד בחודש';
export const SECONDARY_CTA_LABEL = 'שלח הודעה למערכת עכשיו';
export const CALCULATOR_SECTION_ID = 'loss-calculator';
