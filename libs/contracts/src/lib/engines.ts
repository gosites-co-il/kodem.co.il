import { WorkspaceId } from './ids';
import { BusinessProfile } from './profile';
import {
  Insight,
  InsightDraft,
  InsightEngineOutputDraft,
} from './insight';
import {
  Recommendation,
  RecommendationDraft,
  RecommendationEngineOutputDraft,
} from './recommendation';

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Engine<TInput, TOutput> {
  readonly name: string;
  run(input: TInput): Promise<EngineResult<TOutput>>;
}

export interface DiscoveryInput {
  workspaceId: WorkspaceId;
  websiteUrl?: string;
  businessName: string;
}

export interface DiscoveryOutput {
  profile: Omit<BusinessProfile, 'createdAt' | 'updatedAt'>;
  hypotheses: string[];
}

export interface InsightEngineInput {
  workspaceId: WorkspaceId;
  profile: BusinessProfile;
  eventCount: number;
}

export type InsightEngineOutput = InsightEngineOutputDraft;

export interface RecommendationEngineInput {
  workspaceId: WorkspaceId;
  insights: InsightDraft[];
}

export type RecommendationEngineOutput = RecommendationEngineOutputDraft;

export interface RuleEngineInput {
  ruleId: string;
  context: Record<string, unknown>;
}

export interface RuleEngineOutput {
  triggered: boolean;
  actions: string[];
}

export interface LearningEngineInput {
  workspaceId: WorkspaceId;
  feedback: {
    recommendationAccepted: boolean;
    insightHelpful: boolean;
  };
}

export interface LearningEngineOutput {
  updatedHypotheses: string[];
  confidenceAdjustment: number;
}

export interface PipelineDraftResult {
  profile?: BusinessProfile;
  insightDrafts: InsightDraft[];
  recommendationDrafts: RecommendationDraft[];
}

export interface PipelineResult {
  profile?: BusinessProfile;
  insights: Insight[];
  recommendations: Recommendation[];
}

export interface PipelineContext {
  workspaceName: string;
  websiteUrl?: string;
  existingProfile?: BusinessProfile | null;
  eventCount: number;
}
