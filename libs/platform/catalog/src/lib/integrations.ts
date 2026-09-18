import type {
  ChannelDefinition,
  IntegrationDefinition,
} from '@kodem/contracts';

export const PLATFORM_INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    category: 'productivity',
    description: 'Gmail, Calendar, and Drive',
    status: 'coming_soon',
    provider: 'google',
    icon: 'google_workspace',
    capabilities: [
      'email.read',
      'email.send',
      'calendar.read',
      'calendar.write',
      'drive.read',
      'drive.write',
    ],
    backsChannels: ['email'],
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'productivity',
    description: 'Read and write spreadsheets',
    status: 'available',
    provider: 'google',
    icon: 'google_sheets',
    capabilities: ['sheets.read', 'sheets.write'],
  },
  {
    id: 'microsoft_365',
    name: 'Microsoft 365',
    category: 'productivity',
    description: 'Outlook, Teams, and OneDrive',
    status: 'coming_soon',
    provider: 'microsoft',
    icon: 'microsoft_365',
    capabilities: [
      'email.read',
      'email.send',
      'calendar.read',
      'calendar.write',
    ],
    backsChannels: ['email'],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Website traffic and conversion data',
    status: 'coming_soon',
    provider: 'google_analytics',
    icon: 'google_analytics',
    capabilities: ['analytics.read'],
  },
  {
    id: 'google_business',
    name: 'Google Business Profile',
    category: 'local',
    description: 'Reviews, listings, and local presence',
    status: 'coming_soon',
    provider: 'google_business',
    icon: 'google_business',
    capabilities: ['local.reviews.read', 'local.listing.read'],
  },
  {
    id: 'meta',
    name: 'Meta',
    category: 'social',
    description: 'Facebook and Instagram',
    status: 'coming_soon',
    provider: 'meta',
    icon: 'meta',
    capabilities: [
      'messaging.instagram.send',
      'messaging.instagram.receive',
      'messaging.messenger.send',
      'messaging.messenger.receive',
      'messaging.whatsapp.send',
      'messaging.whatsapp.receive',
    ],
    backsChannels: ['instagram', 'facebook_messenger', 'whatsapp'],
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    category: 'advertising',
    description: 'Search and display campaigns',
    status: 'coming_soon',
    provider: 'google_ads',
    icon: 'google_ads',
    capabilities: ['ads.read'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    description: 'WhatsApp Business messaging',
    status: 'coming_soon',
    provider: 'meta',
    icon: 'whatsapp',
    capabilities: [
      'messaging.whatsapp.send',
      'messaging.whatsapp.receive',
    ],
    backsChannels: ['whatsapp'],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'productivity',
    description: 'Team notifications and workspace chat',
    status: 'coming_soon',
    provider: 'slack',
    icon: 'slack',
    capabilities: ['chat.post'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'productivity',
    description: 'Meetings and scheduling',
    status: 'coming_soon',
    provider: 'zoom',
    icon: 'zoom',
    capabilities: ['meetings.create', 'meetings.read'],
  },
];

export const PLATFORM_CHANNELS: ChannelDefinition[] = [
  {
    type: 'email',
    name: 'אימייל',
    description: 'שליחה וקבלת מיילים מול אנשי קשר',
    allowedProviders: ['google', 'microsoft', 'smtp'],
    status: 'coming_soon',
  },
  {
    type: 'whatsapp',
    name: 'WhatsApp',
    description: 'הודעות WhatsApp Business',
    allowedProviders: ['meta'],
    status: 'coming_soon',
  },
  {
    type: 'instagram',
    name: 'Instagram',
    description: 'הודעות Instagram Direct',
    allowedProviders: ['meta'],
    status: 'coming_soon',
  },
  {
    type: 'facebook_messenger',
    name: 'Facebook Messenger',
    description: 'הודעות Messenger',
    allowedProviders: ['meta'],
    status: 'coming_soon',
  },
  {
    type: 'sms',
    name: 'SMS',
    description: 'הודעות טקסט',
    allowedProviders: [],
    status: 'coming_soon',
  },
  {
    type: 'telegram',
    name: 'Telegram',
    description: 'הודעות Telegram',
    allowedProviders: [],
    status: 'coming_soon',
  },
  {
    type: 'phone',
    name: 'טלפון',
    description: 'שיחות טלפון',
    allowedProviders: [],
    status: 'coming_soon',
  },
  {
    type: 'web_chat',
    name: 'צ׳אט באתר',
    description: 'ווידג׳ט צ׳אט באתר העסק',
    allowedProviders: ['kodem'],
    status: 'coming_soon',
  },
];

export function getIntegrationDefinition(
  integrationId: IntegrationDefinition['id'],
): IntegrationDefinition | undefined {
  return PLATFORM_INTEGRATIONS.find((i) => i.id === integrationId);
}

export function getChannelDefinition(
  type: ChannelDefinition['type'],
): ChannelDefinition | undefined {
  return PLATFORM_CHANNELS.find((c) => c.type === type);
}
