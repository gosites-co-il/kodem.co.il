import type {
  BusinessProfile,
  BusinessProfileDraft,
  DiscoveredBusinessInfo,
  SourcedValue,
  WorkspaceSetupData,
} from '@kodem/contracts';
import type { ProfileFieldStatus } from '@kodem/contracts';

function sourced<T>(value: T | undefined, source: string, confidence: number): SourcedValue<T> | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  return { value, source, confidence };
}

function avgConfidence(values: Array<SourcedValue<unknown> | undefined>): number | undefined {
  const scores = values
    .map((v) => v?.confidence)
    .filter((c): c is number => typeof c === 'number');
  if (scores.length === 0) return undefined;
  return scores.reduce((sum, c) => sum + c, 0) / scores.length;
}

/** Build a reviewable draft from discovery + user-provided seed data. */
export function buildProfileDraftFromSetup(
  setup: WorkspaceSetupData,
): BusinessProfileDraft {
  const discovered = setup.discovered;
  const business = setup.business;
  const pick = <T,>(field: SourcedValue<T> | undefined, fallback?: T): T | undefined =>
    field?.value ?? fallback;

  const businessName =
    business?.name?.trim() ||
    pick(discovered?.businessName) ||
    discovered?.name ||
    '';

  const draft: BusinessProfileDraft = {
    businessName,
    legalName: pick(discovered?.legalName),
    description: pick(discovered?.description),
    industry: pick(discovered?.industry) ?? business?.industry,
    subIndustry: pick(discovered?.subIndustry),
    website: business?.websiteUrl?.trim() || pick(discovered?.website),
    logo: pick(discovered?.logo) ?? discovered?.logoUrl,
    language: pick(discovered?.language),
    timezone: 'Asia/Jerusalem',
    emails: pick(discovered?.emails) ?? (discovered?.email ? [discovered.email] : []),
    phones: pick(discovered?.phones) ?? (discovered?.phone ? [discovered.phone] : []),
    addresses: pick(discovered?.addresses) ?? [],
    socialProfiles: pick(discovered?.socialProfiles) ?? [],
    services: pick(discovered?.services) ?? [],
    products: pick(discovered?.products) ?? [],
    fieldStatus: {},
  };

  const fields: Array<[string, unknown, SourcedValue<unknown> | undefined]> = [
    ['businessName', draft.businessName, discovered?.businessName],
    ['legalName', draft.legalName, discovered?.legalName],
    ['description', draft.description, discovered?.description],
    ['industry', draft.industry, discovered?.industry],
    ['subIndustry', draft.subIndustry, discovered?.subIndustry],
    ['website', draft.website, discovered?.website],
    ['logo', draft.logo, discovered?.logo],
    ['language', draft.language, discovered?.language],
    ['emails', draft.emails, discovered?.emails],
    ['phones', draft.phones, discovered?.phones],
    ['addresses', draft.addresses, discovered?.addresses],
    ['socialProfiles', draft.socialProfiles, discovered?.socialProfiles],
    ['services', draft.services, discovered?.services],
    ['products', draft.products, discovered?.products],
  ];

  for (const [key, value, source] of fields) {
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim().length > 0
        : value != null;

    if (!hasValue) {
      draft.fieldStatus[key] = 'missing';
    } else if (key === 'businessName' && business?.name?.trim()) {
      draft.fieldStatus[key] = 'verified';
    } else if (source?.value != null) {
      draft.fieldStatus[key] = 'detected';
    } else {
      draft.fieldStatus[key] = 'verified';
    }
  }

  return draft;
}

export function mergeConfirmedDraft(
  current: BusinessProfileDraft | undefined,
  patch: BusinessProfileDraft,
): BusinessProfileDraft {
  const merged: BusinessProfileDraft = {
    businessName: patch.businessName || current?.businessName || '',
    legalName: patch.legalName ?? current?.legalName,
    description: patch.description ?? current?.description,
    industry: patch.industry ?? current?.industry,
    subIndustry: patch.subIndustry ?? current?.subIndustry,
    website: patch.website ?? current?.website,
    logo: patch.logo ?? current?.logo,
    language: patch.language ?? current?.language,
    timezone: patch.timezone ?? current?.timezone ?? 'Asia/Jerusalem',
    emails: patch.emails ?? current?.emails ?? [],
    phones: patch.phones ?? current?.phones ?? [],
    addresses: patch.addresses ?? current?.addresses ?? [],
    socialProfiles: patch.socialProfiles ?? current?.socialProfiles ?? [],
    services: patch.services ?? current?.services ?? [],
    products: patch.products ?? current?.products ?? [],
    fieldStatus: { ...current?.fieldStatus, ...patch.fieldStatus },
  };

  for (const [key, status] of Object.entries(merged.fieldStatus)) {
    if (status === 'detected' && patch.fieldStatus[key] === 'verified') {
      merged.fieldStatus[key] = 'verified';
    }
  }

  return merged;
}

export function draftToBusinessProfile(
  workspaceId: BusinessProfile['workspaceId'],
  draft: BusinessProfileDraft,
  discovered?: DiscoveredBusinessInfo,
): BusinessProfile {
  const now = new Date();
  const verifiedFields = Object.entries(draft.fieldStatus)
    .filter(([, status]) => status === 'verified')
    .map(([field]) => field);

  const confidenceScore = avgConfidence([
    discovered?.businessName,
    discovered?.description,
    discovered?.industry,
    discovered?.emails,
    discovered?.phones,
    discovered?.logo,
  ]);

  return {
    workspaceId,
    name: draft.businessName,
    legalName: draft.legalName,
    description: draft.description,
    industry: draft.industry,
    subIndustry: draft.subIndustry,
    website: draft.website,
    logo: draft.logo,
    language: draft.language ?? 'he',
    timezone: draft.timezone ?? 'Asia/Jerusalem',
    emails: draft.emails,
    phones: draft.phones,
    addresses: draft.addresses,
    socialProfiles: draft.socialProfiles,
    services: draft.services.length > 0 ? draft.services : ['שירות ליבה'],
    products: draft.products,
    classification: 'SMB',
    communicationChannels: draft.website ? ['website'] : [],
    hypotheses: draft.description
      ? [draft.description]
      : [`${draft.businessName} — פרופיל עסקי מאושר`],
    confidenceScore,
    verifiedFields,
    sourceData: discovered
      ? {
          status: discovered.status,
          structuredData: discovered.structuredData?.value,
          seoMetadata: discovered.seoMetadata?.value,
          openGraph: discovered.openGraph?.value,
          jsonLd: discovered.jsonLd?.value,
        }
      : undefined,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function markDraftFieldVerified(
  draft: BusinessProfileDraft,
  field: string,
  value?: string | string[],
): BusinessProfileDraft {
  const next = { ...draft, fieldStatus: { ...draft.fieldStatus } };
  if (value !== undefined) {
    (next as Record<string, unknown>)[field] = value;
  }
  next.fieldStatus[field] = 'verified';
  return next;
}

export type { ProfileFieldStatus };
