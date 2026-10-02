import { Auditable } from './types';
import { WorkspaceId } from './ids';
import type { BusinessUnderstanding } from './business-intelligence/understanding';
import type { ProfileFieldStatus } from './sourced-value';

/** Where a canonical profile field came from. */
export type ProfileFieldSource =
  | 'USER'
  | 'GOOGLE_BUSINESS'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WEBSITE';

export type ProfileProvenanceField =
  | 'name'
  | 'description'
  | 'industry'
  | 'website'
  | 'phone'
  | 'email'
  | 'address'
  | 'openingHours'
  | 'socialProfile'
  | 'services';

export interface ProfileFieldProvenance {
  source: ProfileFieldSource;
  connectionId?: string;
  resourceId?: string;
  verified: boolean;
  lastSyncedAt?: string;
}

export type ProfileSyncStatus = 'success' | 'partial' | 'failed';

export interface ProfileProvenanceState {
  fields: Partial<Record<ProfileProvenanceField, ProfileFieldProvenance>>;
  lastSyncAt?: string;
  lastSyncStatus?: ProfileSyncStatus;
  lastSyncMessage?: string;
  extras?: {
    openingHours?: string;
  };
}

export interface BusinessRecordField {
  key: string;
  label: string;
  value: string;
  sourceLabel: string;
}

export interface BusinessRecordView {
  crawling: boolean;
  syncStatus?: ProfileSyncStatus;
  syncMessage?: string;
  syncedAt?: string;
  sections: {
    identity: BusinessRecordField[];
    contacts: BusinessRecordField[];
    offers: BusinessRecordField[];
    hours: BusinessRecordField[];
  };
  understandingSummary?: string;
}

export interface BusinessTryFact {
  field: string;
  value: string;
  source: string;
}

export interface BusinessTryAsset {
  type: string;
  url: string;
  status: string;
}

export interface BusinessTryResult {
  provider: {
    provider: string;
    model: string | null;
    configured: boolean;
  };
  facts: BusinessTryFact[];
  assets: BusinessTryAsset[];
  understanding: BusinessUnderstanding | null;
  error: string | null;
}

/** Extensible business identity — source of truth for all Kodem modules. */
export interface BusinessProfile extends Auditable {
  workspaceId: WorkspaceId;
  /** Primary display name (businessName). */
  name: string;
  legalName?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  website?: string;
  logo?: string;
  language?: string;
  timezone?: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  socialProfiles: string[];
  services: string[];
  products: string[];
  classification?: string;
  communicationChannels: string[];
  hypotheses: string[];
  confidenceScore?: number;
  verifiedFields: string[];
  /** Raw discovery payload snapshot for audit / re-enrichment. */
  sourceData?: Record<string, unknown>;
  version: number;
}

/** Draft profile during setup — before persistence. */
export interface BusinessProfileDraft {
  businessName: string;
  legalName?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  website?: string;
  logo?: string;
  language?: string;
  timezone?: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  socialProfiles: string[];
  services: string[];
  products: string[];
  fieldStatus: Partial<Record<string, ProfileFieldStatus>>;
}
