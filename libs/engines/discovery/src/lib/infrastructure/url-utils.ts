export function normalizeUrl(raw: string, baseUrl?: string): string | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:')) {
      return null;
    }

    const url = baseUrl
      ? new URL(trimmed, baseUrl)
      : new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function sameOrigin(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin;
  } catch {
    return false;
  }
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function assetKey(type: string, url: string): string {
  const normalized = normalizeUrl(url) ?? url.trim().toLowerCase();
  return `${type}:${normalized}`;
}

export function resolvePath(baseUrl: string, path: string): string | null {
  return normalizeUrl(path, baseUrl);
}
