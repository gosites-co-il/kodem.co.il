import type { DiscoveryRunInput, DiscoveryRunResult } from '../discovery/result';
import type { BusinessReport } from './report';

export interface BusinessIntelligenceInput extends DiscoveryRunInput {}

export interface NormalizedDiscoveryContext {
  businessName: string;
  websiteUrl?: string;
  factsByField: Record<string, Array<{ value: unknown; source: string; confidence: number }>>;
  assetsProcessed: Array<{ type: string; url: string }>;
  openGraph?: Record<string, string>;
  schemaOrg?: unknown[];
  pageSignals: Array<{ url: string; title?: string; excerpt?: string; kind?: string }>;
}

export interface BusinessIntelligenceResult {
  discovery: DiscoveryRunResult;
  context: NormalizedDiscoveryContext;
  report: BusinessReport;
}
