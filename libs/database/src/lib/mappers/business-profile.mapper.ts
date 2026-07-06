import { BusinessProfile } from '@kodem/contracts';

type ProfileRow = {
  workspaceId: string;
  name: string;
  legalName: string | null;
  description: string | null;
  industry: string | null;
  subIndustry: string | null;
  website: string | null;
  logo: string | null;
  language: string | null;
  timezone: string | null;
  emails: string;
  phones: string;
  addresses: string;
  socialProfiles: string;
  services: string;
  products: string;
  classification: string | null;
  communicationChannels: string;
  hypotheses: string;
  confidenceScore: number | null;
  verifiedFields: string;
  sourceData: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export function mapProfileRowToDomain(row: ProfileRow): BusinessProfile {
  return {
    workspaceId: row.workspaceId as BusinessProfile['workspaceId'],
    name: row.name,
    legalName: row.legalName ?? undefined,
    description: row.description ?? undefined,
    industry: row.industry ?? undefined,
    subIndustry: row.subIndustry ?? undefined,
    website: row.website ?? undefined,
    logo: row.logo ?? undefined,
    language: row.language ?? undefined,
    timezone: row.timezone ?? undefined,
    emails: parseJsonArray(row.emails),
    phones: parseJsonArray(row.phones),
    addresses: parseJsonArray(row.addresses),
    socialProfiles: parseJsonArray(row.socialProfiles),
    services: parseJsonArray(row.services),
    products: parseJsonArray(row.products),
    classification: row.classification ?? undefined,
    communicationChannels: parseJsonArray(row.communicationChannels),
    hypotheses: parseJsonArray(row.hypotheses),
    confidenceScore: row.confidenceScore ?? undefined,
    verifiedFields: parseJsonArray(row.verifiedFields),
    sourceData: parseJsonObject(row.sourceData),
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProfileToPersistence(profile: BusinessProfile) {
  return {
    workspaceId: profile.workspaceId,
    name: profile.name,
    legalName: profile.legalName ?? null,
    description: profile.description ?? null,
    industry: profile.industry ?? null,
    subIndustry: profile.subIndustry ?? null,
    website: profile.website ?? null,
    logo: profile.logo ?? null,
    language: profile.language ?? null,
    timezone: profile.timezone ?? null,
    emails: JSON.stringify(profile.emails ?? []),
    phones: JSON.stringify(profile.phones ?? []),
    addresses: JSON.stringify(profile.addresses ?? []),
    socialProfiles: JSON.stringify(profile.socialProfiles ?? []),
    services: JSON.stringify(profile.services ?? []),
    products: JSON.stringify(profile.products ?? []),
    classification: profile.classification ?? null,
    communicationChannels: JSON.stringify(profile.communicationChannels ?? []),
    hypotheses: JSON.stringify(profile.hypotheses ?? []),
    confidenceScore: profile.confidenceScore ?? null,
    verifiedFields: JSON.stringify(profile.verifiedFields ?? []),
    sourceData: profile.sourceData ? JSON.stringify(profile.sourceData) : null,
    version: profile.version,
  };
}
