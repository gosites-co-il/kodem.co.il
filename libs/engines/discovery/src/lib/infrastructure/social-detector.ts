import type { DiscoveryAsset, DiscoveryAssetType } from '@kodem/contracts';
import { createAsset } from '../domain/fact-utils';
import { normalizeUrl } from './url-utils';

interface SocialPattern {
  type: DiscoveryAssetType;
  priority: number;
  test: RegExp;
  normalize: (url: string) => string | null;
}

const SOCIAL_PATTERNS: SocialPattern[] = [
  {
    type: 'FACEBOOK',
    priority: 90,
    test: /(^|\.)facebook\.com\//i,
    normalize: (url) => normalizeUrl(url),
  },
  {
    type: 'INSTAGRAM',
    priority: 80,
    test: /(^|\.)instagram\.com\//i,
    normalize: (url) => normalizeUrl(url),
  },
  {
    type: 'LINKEDIN',
    priority: 70,
    test: /(^|\.)linkedin\.com\/(company|school|showcase)\//i,
    normalize: (url) => normalizeUrl(url),
  },
  {
    type: 'TIKTOK',
    priority: 60,
    test: /(^|\.)tiktok\.com\/@/i,
    normalize: (url) => normalizeUrl(url),
  },
  {
    type: 'GOOGLE_BUSINESS',
    priority: 85,
    test: /(^|\.)google\.com\/maps|(^|\.)business\.google\.com/i,
    normalize: (url) => normalizeUrl(url),
  },
];

export function detectSocialAssets(
  links: string[],
  sourceAssetId: string,
  depth: number,
): DiscoveryAsset[] {
  const assets: DiscoveryAsset[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    for (const pattern of SOCIAL_PATTERNS) {
      if (!pattern.test.test(link)) {
        continue;
      }

      const normalized = pattern.normalize(link);
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      const asset = createAsset(
        pattern.type,
        normalized,
        sourceAssetId,
        pattern.priority,
        depth,
      );

      if (asset) {
        assets.push(asset);
      }
    }
  }

  return assets;
}

export function classifySocialUrl(url: string): DiscoveryAssetType | null {
  for (const pattern of SOCIAL_PATTERNS) {
    if (pattern.test.test(url)) {
      return pattern.type;
    }
  }
  return null;
}

const INTERNAL_PAGE_HINTS = [
  'about',
  'about-us',
  'contact',
  'services',
  'service',
  'products',
  'product',
  'pricing',
  'team',
  'employers',
  'company',
  'careers',
  'אודות',
  'צור-קשר',
  'צור קשר',
  'שירותים',
  'מוצרים',
  'מעסיקים',
  'דרושים',
];

export function findInternalPages(links: string[], baseUrl: string): string[] {
  const base = normalizeUrl(baseUrl);
  if (!base) {
    return [];
  }

  const matches: string[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const normalized = normalizeUrl(link, base);
    if (!normalized || seen.has(normalized) || normalized === base) {
      continue;
    }

    try {
      const url = new URL(normalized);
      const baseOrigin = new URL(base).origin;
      if (url.origin !== baseOrigin) {
        continue;
      }

      const path = `${url.pathname}${url.search}`.toLowerCase();
      if (INTERNAL_PAGE_HINTS.some((hint) => path.includes(hint))) {
        seen.add(normalized);
        matches.push(normalized);
      }
    } catch {
      // skip
    }
  }

  return matches.slice(0, 6);
}

export function getProviderPriority(type: DiscoveryAssetType): number {
  const pattern = SOCIAL_PATTERNS.find((p) => p.type === type);
  if (pattern) {
    return pattern.priority;
  }
  return type === 'WEBSITE' ? 100 : 50;
}
