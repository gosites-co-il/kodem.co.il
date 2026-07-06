import type { BusinessProfileDraft } from './profile';
import type { SourcedValue } from './sourced-value';

/** Workspace Setup Journey — step identifiers (extensible). */
export type SetupStepId =
  | 'welcome'
  | 'business_discovery'
  | 'business_confirmation'
  | 'workspace_creation'
  | 'connections'
  | 'modules'
  | 'ai'
  | 'preparation'
  | 'ready';

export const SETUP_STEPS: readonly SetupStepId[] = [
  'welcome',
  'business_discovery',
  'business_confirmation',
  'workspace_creation',
  'connections',
  'modules',
  'ai',
  'preparation',
  'ready',
] as const;

/** @deprecated Use business_discovery — kept for in-flight setup migration. */
export type LegacySetupStepId = SetupStepId | 'business' | 'discovery';

export type IntegrationId =
  | 'google_workspace'
  | 'microsoft_365'
  | 'google_analytics'
  | 'google_business'
  | 'meta'
  | 'google_ads'
  | 'whatsapp'
  | 'shopify'
  | 'woocommerce';

export type AiProviderId =
  | 'kodem'
  | 'openai'
  | 'anthropic'
  | 'google_gemini'
  | 'azure_openai';

export type ModuleId =
  | 'crm'
  | 'knowledge'
  | 'insights'
  | 'digital_card'
  | 'campaign_manager'
  | 'automation'
  | 'external_ai';

export interface SetupBusinessData {
  name?: string;
  websiteUrl?: string;
  industry?: string;
  businessSize?: string;
}

export interface DiscoveredBusinessInfo {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'partial';
  businessName?: SourcedValue;
  legalName?: SourcedValue;
  website?: SourcedValue;
  logo?: SourcedValue;
  language?: SourcedValue;
  description?: SourcedValue;
  industry?: SourcedValue;
  subIndustry?: SourcedValue;
  emails?: SourcedValue<string[]>;
  phones?: SourcedValue<string[]>;
  addresses?: SourcedValue<string[]>;
  socialProfiles?: SourcedValue<string[]>;
  services?: SourcedValue<string[]>;
  products?: SourcedValue<string[]>;
  structuredData?: SourcedValue<Record<string, unknown>>;
  seoMetadata?: SourcedValue<Record<string, unknown>>;
  openGraph?: SourcedValue<Record<string, unknown>>;
  jsonLd?: SourcedValue<unknown[]>;
  publicInfo?: SourcedValue<Record<string, unknown>>;
  /** Legacy flat mirrors for gradual migration. */
  name?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
}

export interface SetupConnectionsData {
  connected: IntegrationId[];
  skipped: IntegrationId[];
}

export interface SetupModulesData {
  activated: ModuleId[];
}

export interface SetupAiData {
  provider: AiProviderId;
  skipped?: boolean;
}

export interface SetupProgressTask {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed';
}

export interface SetupDiscoveryFinding {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed';
}

export interface WorkspaceSetupData {
  business?: SetupBusinessData;
  discovered?: DiscoveredBusinessInfo;
  confirmedProfile?: BusinessProfileDraft;
  connections?: SetupConnectionsData;
  modules?: SetupModulesData;
  ai?: SetupAiData;
  preparationTasks?: SetupProgressTask[];
  discoveryFindings?: SetupDiscoveryFinding[];
}

export interface SetupStateResponse {
  step: SetupStepId;
  stepIndex: number;
  totalSteps: number;
  workspace: import('./workspace').Workspace;
  setup: WorkspaceSetupData;
}

export interface AdvanceSetupInput {
  step: SetupStepId;
  data?: Partial<WorkspaceSetupData>;
}
