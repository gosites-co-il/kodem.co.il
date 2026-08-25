import type {
  IntegrationDefinition,
  IntegrationId,
} from '@kodem/contracts';

export const PLATFORM_INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    category: 'productivity',
    description: 'Gmail, Calendar, and Drive',
    status: 'coming_soon',
  },
  {
    id: 'microsoft_365',
    name: 'Microsoft 365',
    category: 'productivity',
    description: 'Outlook, Teams, and OneDrive',
    status: 'coming_soon',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Website traffic and conversion data',
    status: 'coming_soon',
  },
  {
    id: 'google_business',
    name: 'Google Business Profile',
    category: 'local',
    description: 'Reviews, listings, and local presence',
    status: 'coming_soon',
  },
  {
    id: 'meta',
    name: 'Meta',
    category: 'social',
    description: 'Facebook and Instagram',
    status: 'coming_soon',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    category: 'advertising',
    description: 'Search and display campaigns',
    status: 'coming_soon',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    description: 'WhatsApp Business messaging',
    status: 'coming_soon',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'commerce',
    description: 'Online store and orders',
    status: 'coming_soon',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'commerce',
    description: 'WordPress commerce store',
    status: 'coming_soon',
  },
];

export function getIntegrationDefinition(
  integrationId: IntegrationId,
): IntegrationDefinition | undefined {
  return PLATFORM_INTEGRATIONS.find((i) => i.id === integrationId);
}
