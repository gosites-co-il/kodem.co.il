export type DetectedNetwork =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'whatsapp'
  | 'website';

const NETWORK_HOSTS: { id: Exclude<DetectedNetwork, 'website'>; hosts: string[] }[] = [
  { id: 'instagram', hosts: ['instagram.com', 'instagr.am'] },
  { id: 'facebook', hosts: ['facebook.com', 'fb.com', 'fb.me', 'm.facebook.com'] },
  { id: 'tiktok', hosts: ['tiktok.com', 'vm.tiktok.com'] },
  { id: 'youtube', hosts: ['youtube.com', 'youtu.be', 'm.youtube.com'] },
  { id: 'linkedin', hosts: ['linkedin.com'] },
  { id: 'x', hosts: ['twitter.com', 'x.com', 't.co'] },
  { id: 'whatsapp', hosts: ['whatsapp.com', 'wa.me', 'api.whatsapp.com'] },
];

function extractHost(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`;
    const url = new URL(withScheme);
    return url.hostname.replace(/^www\./, '');
  } catch {
    // Bare path / handle without dots — not identifiable yet
    return null;
  }
}

/** Identify social / website from a pasted link or domain. */
export function detectNetwork(raw: string): DetectedNetwork | null {
  const host = extractHost(raw);
  if (!host) return null;

  for (const entry of NETWORK_HOSTS) {
    if (entry.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return entry.id;
    }
  }

  // Any other parseable host → generic site
  if (host.includes('.')) return 'website';
  return null;
}

export const NETWORK_LABELS: Record<DetectedNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  whatsapp: 'WhatsApp',
  website: 'אתר',
};
