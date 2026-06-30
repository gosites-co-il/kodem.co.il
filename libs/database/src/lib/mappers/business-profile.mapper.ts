import { BusinessProfile } from '@kodem/contracts';

type ProfileRow = {
  workspaceId: string;
  name: string;
  industry: string | null;
  services: string;
  classification: string | null;
  communicationChannels: string;
  hypotheses: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export function mapProfileRowToDomain(row: ProfileRow): BusinessProfile {
  return {
    workspaceId: row.workspaceId as BusinessProfile['workspaceId'],
    name: row.name,
    industry: row.industry ?? undefined,
    services: JSON.parse(row.services),
    classification: row.classification ?? undefined,
    communicationChannels: JSON.parse(row.communicationChannels),
    hypotheses: JSON.parse(row.hypotheses),
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProfileToPersistence(profile: BusinessProfile) {
  return {
    workspaceId: profile.workspaceId,
    name: profile.name,
    industry: profile.industry,
    services: JSON.stringify(profile.services),
    classification: profile.classification,
    communicationChannels: JSON.stringify(profile.communicationChannels),
    hypotheses: JSON.stringify(profile.hypotheses),
    version: profile.version,
  };
}
