import type {
  AiProviderId,
  IntegrationId,
  ModuleId,
} from '@kodem/contracts';
import {
  PLATFORM_INTEGRATIONS,
  PLATFORM_MODULES,
} from '@kodem/platform/catalog';

/** Setup UI catalogs — sourced from platform catalog (single source of truth). */
export const INTEGRATIONS: {
  id: IntegrationId;
  name: string;
  description: string;
}[] = PLATFORM_INTEGRATIONS.map((i) => ({
  id: i.id,
  name: i.name,
  description: i.description ?? '',
}));

const FREE_IDS = new Set(
  PLATFORM_MODULES.filter((m) => m.commercial.includedIn.includes('free')).map(
    (m) => m.id,
  ),
);

export const INCLUDED_MODULES: {
  id: ModuleId;
  name: string;
  description: string;
}[] = PLATFORM_MODULES.filter((m) => FREE_IDS.has(m.id)).map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description ?? '',
}));

export const PREMIUM_MODULES: {
  id: ModuleId;
  name: string;
  description: string;
}[] = PLATFORM_MODULES.filter((m) => !FREE_IDS.has(m.id)).map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description ?? '',
}));

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
