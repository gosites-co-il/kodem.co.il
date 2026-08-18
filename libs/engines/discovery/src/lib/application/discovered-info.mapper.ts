import type {
  BusinessProfile,
  DiscoveredBusinessInfo,
  SourcedValue,
} from '@kodem/contracts';
import type { MergeEngine } from '../domain/merge-engine';

function toSourced<T>(
  value: T | undefined,
  source?: string,
  confidence?: number,
): SourcedValue<T> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value) && value.length === 0) {
    return undefined;
  }
  if (typeof value === 'string' && !value.trim()) {
    return undefined;
  }

  return {
    value,
    source: source ?? 'discovery',
    confidence: confidence ?? 0.5,
  };
}

export function toDiscoveredBusinessInfo(
  mergeEngine: MergeEngine,
  profile: Omit<BusinessProfile, 'createdAt' | 'updatedAt'>,
): DiscoveredBusinessInfo {
  const merged = mergeEngine.getMerged();
  const pick = <T,>(field: Parameters<typeof merged.get>[0]) => merged.get(field);

  const structured = Object.fromEntries(
    [...merged.entries()].map(([field, fact]) => [
      field,
      { value: fact.value, source: fact.source, confidence: fact.confidence },
    ]),
  );

  const discovered: DiscoveredBusinessInfo = {
    status: 'completed',
    businessName: toSourced(
      profile.name,
      pick('businessName')?.source,
      pick('businessName')?.confidence,
    ),
    legalName: toSourced(
      profile.legalName,
      pick('legalName')?.source,
      pick('legalName')?.confidence,
    ),
    website: toSourced(
      profile.website,
      pick('website')?.source,
      pick('website')?.confidence,
    ),
    logo: toSourced(profile.logo, pick('logo')?.source, pick('logo')?.confidence),
    language: toSourced(
      profile.language,
      pick('language')?.source,
      pick('language')?.confidence,
    ),
    description: toSourced(
      profile.description,
      pick('description')?.source,
      pick('description')?.confidence,
    ),
    industry: toSourced(
      profile.industry,
      pick('industry')?.source,
      pick('industry')?.confidence,
    ),
    subIndustry: toSourced(
      profile.subIndustry,
      pick('subIndustry')?.source,
      pick('subIndustry')?.confidence,
    ),
    emails: toSourced(
      profile.emails,
      pick('emails')?.source,
      pick('emails')?.confidence,
    ),
    phones: toSourced(
      profile.phones,
      pick('phones')?.source,
      pick('phones')?.confidence,
    ),
    addresses: toSourced(
      profile.addresses,
      pick('addresses')?.source,
      pick('addresses')?.confidence,
    ),
    socialProfiles: toSourced(
      profile.socialProfiles,
      pick('socialProfiles')?.source,
      pick('socialProfiles')?.confidence,
    ),
    services: toSourced(
      profile.services,
      pick('services')?.source,
      pick('services')?.confidence,
    ),
    products: toSourced(
      profile.products,
      pick('products')?.source,
      pick('products')?.confidence,
    ),
    structuredData: toSourced(structured, 'discovery_merge', profile.confidenceScore),
    seoMetadata: toSourced(
      {
        title: profile.name,
        description: profile.description,
      },
      'website',
      0.6,
    ),
    openGraph: toSourced(
      {
        'og:title': profile.name,
        'og:description': profile.description,
        'og:image': profile.logo,
      },
      'open_graph',
      0.65,
    ),
    jsonLd: toSourced(
      Object.values(structured),
      'schema.org',
      0.7,
    ),
    publicInfo: toSourced(
      {
        rating: pick('rating')?.value,
        reviewCount: pick('reviewCount')?.value,
        openingHours: pick('openingHours')?.value,
        companySize: pick('companySize')?.value,
        employeeCount: pick('employeeCount')?.value,
      },
      'public_sources',
      profile.confidenceScore,
    ),
    name: profile.name,
    logoUrl: profile.logo,
    email: profile.emails[0],
    phone: profile.phones[0],
  };

  const hasSignals = Boolean(
    discovered.description?.value ||
      discovered.industry?.value ||
      (discovered.emails?.value?.length ?? 0) > 0 ||
      (discovered.socialProfiles?.value?.length ?? 0) > 0,
  );

  if (!hasSignals) {
    discovered.status = 'partial';
  }

  return discovered;
}
