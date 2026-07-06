import { Auditable } from './types';
import { WorkspaceId } from './ids';
import type { ProfileFieldStatus } from './sourced-value';

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
