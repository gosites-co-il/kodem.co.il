import type { ConnectionProviderId } from '@kodem/contracts';
import type { ConnectionProviderAdapter } from './types';
import { stubAdapter } from './types';
import { googleConnectionAdapter } from './google/adapter';
import { metaConnectionAdapter } from './meta/adapter';

const adapters: ConnectionProviderAdapter[] = [
  googleConnectionAdapter,
  metaConnectionAdapter,
  stubAdapter(
    'microsoft',
    ['email.read', 'email.send', 'calendar.read', 'calendar.write'],
    'Microsoft',
  ),
  stubAdapter('smtp', ['email.send'], 'SMTP'),
  stubAdapter('slack', ['chat.post'], 'Slack'),
  stubAdapter('zoom', ['meetings.create', 'meetings.read'], 'Zoom'),
  stubAdapter(
    'kodem',
    ['messaging.web_chat.send', 'messaging.web_chat.receive'],
    'Kodem Web Chat',
  ),
  // google_analytics / google_business use provider `google` (shared adapter).
  stubAdapter('google_ads', ['ads.read'], 'Google Ads'),
];

const byProvider = new Map(
  adapters.map((a) => [a.provider, a] as const),
);

export function getConnectionAdapter(
  provider: ConnectionProviderId,
): ConnectionProviderAdapter | undefined {
  return byProvider.get(provider);
}

export function listConnectionAdapters(): ConnectionProviderAdapter[] {
  return [...adapters];
}
