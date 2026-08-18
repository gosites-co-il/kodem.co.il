import type { BusinessFact, BusinessFactField, BusinessFactSource } from '@kodem/contracts';
import type { DiscoveryAsset, DiscoveryAssetType } from '@kodem/contracts';
import { assetKey, normalizeUrl } from '../infrastructure/url-utils';

export function createFact(
  field: BusinessFactField,
  value: unknown,
  source: BusinessFactSource,
  confidence: number,
  options?: { assetId?: string; assetType?: string; verified?: boolean },
): BusinessFact | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  if (Array.isArray(value) && value.length === 0) {
    return null;
  }

  return {
    field,
    value,
    source,
    confidence,
    verified: options?.verified ?? false,
    timestamp: new Date(),
    assetId: options?.assetId,
    assetType: options?.assetType,
  };
}

export function createAsset(
  type: DiscoveryAssetType,
  url: string,
  source: string,
  priority: number,
  depth: number,
): DiscoveryAsset | null {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return null;
  }

  return {
    id: assetKey(type, normalized),
    type,
    source,
    url: normalized,
    status: 'pending',
    priority,
    depth,
  };
}

export function uniqueStrings(values: string[]): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return [...unique];
}

export function mergeStringArrays(
  existing: string[] | undefined,
  incoming: string[],
): string[] {
  return uniqueStrings([...(existing ?? []), ...incoming]);
}

export function appendFact(
  facts: BusinessFact[],
  fact: BusinessFact | null,
): void {
  if (fact) {
    facts.push(fact);
  }
}
