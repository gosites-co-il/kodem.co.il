import type {
  BusinessFact,
  BusinessFactField,
  BusinessProfile,
  DiscoveryRunInput,
} from '@kodem/contracts';
import type { MergeEngine } from './merge-engine';

function readString(fact: BusinessFact | undefined): string | undefined {
  if (!fact) {
    return undefined;
  }
  return typeof fact.value === 'string' ? fact.value : undefined;
}

function readStringArray(fact: BusinessFact | undefined): string[] {
  if (!fact || !Array.isArray(fact.value)) {
    return [];
  }
  return fact.value.filter((v): v is string => typeof v === 'string');
}

function readNumber(fact: BusinessFact | undefined): number | undefined {
  if (!fact) {
    return undefined;
  }
  return typeof fact.value === 'number' ? fact.value : undefined;
}

export function assembleBusinessProfile(
  mergeEngine: MergeEngine,
  input: DiscoveryRunInput,
): Omit<BusinessProfile, 'createdAt' | 'updatedAt'> {
  const merged = mergeEngine.getMerged();

  const businessName =
    readString(merged.get('businessName'))?.trim() || input.businessName.trim();

  const website =
    readString(merged.get('website'))?.trim() || input.websiteUrl?.trim();

  const services = readStringArray(merged.get('services'));
  const products = readStringArray(merged.get('products'));
  const emails = readStringArray(merged.get('emails'));
  const phones = readStringArray(merged.get('phones'));
  const addresses = readStringArray(merged.get('addresses'));
  const socialProfiles = readStringArray(merged.get('socialProfiles'));

  const channels = new Set<string>();
  if (website) {
    channels.add('website');
  }
  if (socialProfiles.length > 0) {
    channels.add('social');
  }
  if (emails.length > 0) {
    channels.add('email');
  }
  if (phones.length > 0) {
    channels.add('phone');
  }

  const hypotheses = buildHypotheses(merged, input, {
    services,
    socialProfiles,
    website,
  });

  const verifiedFields: BusinessFactField[] = [];
  const sourceData: Record<string, unknown> = {};
  const confidenceValues: number[] = [];

  for (const [field, fact] of merged) {
    if (fact.verified) {
      verifiedFields.push(field);
    }
    confidenceValues.push(fact.confidence);
    sourceData[field] = {
      value: fact.value,
      source: fact.source,
      confidence: fact.confidence,
      verified: fact.verified,
    };
  }

  const confidenceScore =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, v) => sum + v, 0) / confidenceValues.length
      : undefined;

  return {
    workspaceId: input.workspaceId,
    name: businessName,
    legalName: readString(merged.get('legalName')),
    description: readString(merged.get('description')),
    industry: readString(merged.get('industry')),
    subIndustry: readString(merged.get('subIndustry')),
    website,
    logo: readString(merged.get('logo')),
    language: readString(merged.get('language')),
    timezone: readString(merged.get('timezone')),
    emails,
    phones,
    addresses,
    socialProfiles,
    services,
    products,
    classification: readString(merged.get('businessCategory')),
    communicationChannels: [...channels],
    hypotheses,
    confidenceScore,
    verifiedFields,
    sourceData,
    version: 1,
  };
}

function buildHypotheses(
  merged: Map<BusinessFactField, BusinessFact>,
  input: DiscoveryRunInput,
  context: {
    services: string[];
    socialProfiles: string[];
    website?: string;
  },
): string[] {
  const hypotheses: string[] = [];

  const industry = readString(merged.get('industry'));
  if (industry) {
    hypotheses.push(`Industry signal detected: ${industry}`);
  }

  if (context.services.length > 0) {
    hypotheses.push(
      `Offers ${context.services.length} service(s): ${context.services.slice(0, 3).join(', ')}`,
    );
  }

  if (context.socialProfiles.length > 0) {
    hypotheses.push(
      `Active on ${context.socialProfiles.length} social channel(s)`,
    );
  }

  if (!context.website) {
    hypotheses.push('No public website discovered during crawl');
  }

  if (hypotheses.length === 0) {
    hypotheses.push(
      `Discovery completed for "${input.businessName}" with limited public signals`,
    );
  }

  return hypotheses;
}

export function assembleRating(merged: Map<BusinessFactField, BusinessFact>) {
  return {
    rating: readNumber(merged.get('rating')),
    reviewCount: readNumber(merged.get('reviewCount')),
  };
}
