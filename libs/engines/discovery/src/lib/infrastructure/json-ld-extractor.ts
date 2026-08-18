import type { BusinessFact } from '@kodem/contracts';
import { appendFact, createFact } from '../domain/fact-utils';

const ORGANIZATION_TYPES = new Set([
  'organization',
  'localbusiness',
  'corporation',
  'store',
  'restaurant',
  'professionalService',
  'professionalservice',
]);

export function extractFactsFromJsonLd(
  nodes: unknown[],
  assetId: string,
  assetType: string,
): BusinessFact[] {
  const facts: BusinessFact[] = [];

  for (const node of nodes) {
    collectJsonLdNode(node, facts, assetId, assetType);
  }

  return facts;
}

function collectJsonLdNode(
  node: unknown,
  facts: BusinessFact[],
  assetId: string,
  assetType: string,
): void {
  if (!node || typeof node !== 'object') {
    return;
  }

  const record = node as Record<string, unknown>;

  if (Array.isArray(record['@graph'])) {
    for (const child of record['@graph']) {
      collectJsonLdNode(child, facts, assetId, assetType);
    }
  }

  const typeValue = record['@type'];
  const types = Array.isArray(typeValue)
    ? typeValue.map(String)
    : typeValue
      ? [String(typeValue)]
      : [];

  const isOrg = types.some((t) =>
    ORGANIZATION_TYPES.has(t.toLowerCase().replace(/\s+/g, '')),
  );

  if (!isOrg && !record.name) {
    return;
  }

  const options = { assetId, assetType, verified: isOrg };

  appendFact(
    facts,
    createFact('businessName', readString(record.name), 'schema.org', 0.92, options),
  );
  appendFact(
    facts,
    createFact('legalName', readString(record.legalName), 'schema.org', 0.88, options),
  );
  appendFact(
    facts,
    createFact('description', readString(record.description), 'schema.org', 0.85, options),
  );
  appendFact(
    facts,
    createFact('website', readUrl(record.url), 'schema.org', 0.9, options),
  );
  appendFact(
    facts,
    createFact('logo', readImage(record.logo), 'schema.org', 0.86, options),
  );
  appendFact(
    facts,
    createFact('industry', readString(record.industry), 'schema.org', 0.8, options),
  );

  const email = readContact(record.email);
  if (email) {
    appendFact(
      facts,
      createFact('emails', [email], 'schema.org', 0.9, options),
    );
  }

  const phone = readContact(record.telephone);
  if (phone) {
    appendFact(
      facts,
      createFact('phones', [phone], 'schema.org', 0.9, options),
    );
  }

  const address = readAddress(record.address);
  if (address) {
    appendFact(
      facts,
      createFact('addresses', [address], 'schema.org', 0.88, options),
    );
  }

  if (record.aggregateRating && typeof record.aggregateRating === 'object') {
    const rating = record.aggregateRating as Record<string, unknown>;
    appendFact(
      facts,
      createFact('rating', readNumber(rating.ratingValue), 'schema.org', 0.85, options),
    );
    appendFact(
      facts,
      createFact(
        'reviewCount',
        readNumber(rating.reviewCount),
        'schema.org',
        0.85,
        options,
      ),
    );
  }

  if (record.openingHoursSpecification) {
    const hours = formatOpeningHours(record.openingHoursSpecification);
    appendFact(
      facts,
      createFact('openingHours', hours, 'schema.org', 0.8, options),
    );
  }

  const sameAs = record.sameAs;
  if (Array.isArray(sameAs)) {
    const links = sameAs.filter((v): v is string => typeof v === 'string');
    appendFact(
      facts,
      createFact('socialProfiles', links, 'schema.org', 0.82, options),
    );
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readUrl(value: unknown): string | undefined {
  return readString(value);
}

function readImage(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    return readString((value as Record<string, unknown>).url);
  }
  return undefined;
}

function readContact(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }
  return undefined;
}

function readAddress(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const address = value as Record<string, unknown>;
  const parts = [
    readString(address.streetAddress),
    readString(address.addressLocality),
    readString(address.addressRegion),
    readString(address.postalCode),
    readString(address.addressCountry),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : undefined;
}

function formatOpeningHours(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parts = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const day = readString(record.dayOfWeek);
      const opens = readString(record.opens);
      const closes = readString(record.closes);
      if (day && opens && closes) {
        return `${day} ${opens}-${closes}`;
      }
      return null;
    })
    .filter((v): v is string => Boolean(v));

  return parts.length > 0 ? parts.join('; ') : undefined;
}
