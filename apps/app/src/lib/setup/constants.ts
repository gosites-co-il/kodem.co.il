import type {
  AiProviderId,
  IntegrationId,
  ModuleId,
} from '@kodem/contracts';

export const INTEGRATIONS: {
  id: IntegrationId;
  name: string;
  description: string;
}[] = [
  { id: 'google_workspace', name: 'Google Workspace', description: 'אימייל, לוח שנה ומסמכים' },
  { id: 'microsoft_365', name: 'Microsoft 365', description: 'Outlook, Teams ו-Office' },
  { id: 'google_analytics', name: 'Google Analytics', description: 'נתוני תנועה ומדידה' },
  { id: 'google_business', name: 'Google Business Profile', description: 'נוכחות מקומית בגוגל' },
  { id: 'meta', name: 'Meta', description: 'פייסבוק ואינסטגרם' },
  { id: 'google_ads', name: 'Google Ads', description: 'קמפיינים ממומנים' },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'תקשורת עם לקוחות' },
  { id: 'shopify', name: 'Shopify', description: 'חנות אונליין' },
  { id: 'woocommerce', name: 'WooCommerce', description: 'מסחר אלקטרוני' },
];

export const INCLUDED_MODULES: { id: ModuleId; name: string; description: string }[] = [
  { id: 'crm', name: 'CRM', description: 'ניהול לקוחות ומכירות' },
  { id: 'knowledge', name: 'Knowledge', description: 'בסיס ידע עסקי' },
  { id: 'insights', name: 'Insights', description: 'תובנות חכמות' },
  { id: 'digital_card', name: 'Digital Card', description: 'כרטיס ביקור דיגיטלי' },
];

export const PREMIUM_MODULES: { id: ModuleId; name: string; description: string }[] = [
  { id: 'campaign_manager', name: 'Campaign Manager', description: 'ניהול קמפיינים' },
  { id: 'automation', name: 'Automation', description: 'אוטומציות עסקיות' },
  { id: 'external_ai', name: 'External AI Providers', description: 'חיבור לספקי AI חיצוניים' },
];

export const AI_PROVIDERS: {
  id: AiProviderId;
  name: string;
  description: string;
  premium?: boolean;
}[] = [
  { id: 'kodem', name: 'Kodem AI', description: 'מותאם לעסק שלך — ברירת מחדל' },
  { id: 'openai', name: 'OpenAI', description: 'GPT', premium: true },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude', premium: true },
  { id: 'google_gemini', name: 'Google Gemini', description: 'Gemini', premium: true },
  { id: 'azure_openai', name: 'Azure OpenAI', description: 'Enterprise', premium: true },
];

export const INDUSTRY_OPTIONS = [
  'טכנולוגיה',
  'שירותים מקצועיים',
  'קמעונאות',
  'בריאות',
  'חינוך',
  'נדל״ן',
  'מסעדנות',
  'אחר',
] as const;

export const BUSINESS_SIZE_OPTIONS = [
  { value: 'solo', label: 'רק אני' },
  { value: '2-10', label: '2–10 עובדים' },
  { value: '11-50', label: '11–50 עובדים' },
  { value: '51+', label: '51+ עובדים' },
] as const;
