import type { BusinessReportDraft } from './business-intelligence';
import type { BusinessProfileDraft } from './profile';
import type { SourcedValue } from './sourced-value';

/** Workspace Setup Journey — step identifiers (extensible). */
export type SetupStepId =
  | 'welcome'
  | 'business_discovery'
  | 'business_understanding'
  | 'connections'
  | 'ready';

export const SETUP_STEPS: readonly SetupStepId[] = [
  'welcome',
  'business_discovery',
  'business_understanding',
  'connections',
  'ready',
] as const;

/** Bump when SETUP_STEPS order/membership changes (for onboardingStep remaps). */
export const SETUP_JOURNEY_VERSION = 3;

/** @deprecated Use business_understanding */
export type LegacySetupStepId =
  | SetupStepId
  | 'business'
  | 'discovery'
  | 'business_confirmation'
  | 'workspace_creation'
  | 'modules'
  | 'ai'
  | 'preparation';

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

/** Background channels kicked off from corporate-email identity. */
export type EarlyDiscoverySourceId =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'google_business'
  | 'linkedin'
  | 'twitter';

export type SetupSocialChannel = Exclude<EarlyDiscoverySourceId, 'website'>;

export interface SetupBusinessData {
  name?: string;
  websiteUrl?: string;
  industry?: string;
  businessSize?: string;
  /** Primary business address (from discovery or user). */
  address?: string;
  /** Social / listing URLs keyed by channel. */
  socials?: Partial<Record<SetupSocialChannel, string>>;
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

export interface EarlyDiscoverySource {
  id: EarlyDiscoverySourceId;
  label: string;
  status: 'pending' | 'running' | 'found' | 'not_found' | 'failed';
  url?: string;
}

export interface EarlyDiscoveryState {
  startedAt: string;
  websiteUrl: string;
  sources: EarlyDiscoverySource[];
}

export interface WorkspaceSetupData {
  /** Tracks SETUP_JOURNEY_VERSION for onboardingStep remaps. */
  setupJourneyVersion?: number;
  /**
   * How the welcome/identity step collects defaults.
   * - `email_assisted` (default): peek corporate email → slug/website + early discovery
   * - `manual`: blank form — start-over and future “new workspace” flows
   */
  identityMode?: 'email_assisted' | 'manual';
  business?: SetupBusinessData;
  discovered?: DiscoveredBusinessInfo;
  businessReport?: BusinessReportDraft;
  confirmedProfile?: BusinessProfileDraft;
  /** Set when business_understanding is approved and persisted to domain entities. */
  businessApproved?: boolean;
  /** Set when step 1 identity (business + workspace + slug) is saved. */
  identityComplete?: boolean;
  /** Corporate-domain background discovery for stage 2. */
  earlyDiscovery?: EarlyDiscoveryState;
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
  /** Server-side action — does not advance the step index. */
  action?: 'restart_discovery' | 'go_back' | 'start_over';
}
