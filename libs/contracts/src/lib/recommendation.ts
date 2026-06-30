import { RecommendationId, WorkspaceId } from './ids';

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: RecommendationId;
  workspaceId: WorkspaceId;
  action: string;
  rationale: string;
  expectedImpact: ImpactLevel;
  priority: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface RecommendationDraft {
  action: string;
  rationale: string;
  expectedImpact: ImpactLevel;
  priority: number;
  isPrimary?: boolean;
}

export interface RecommendationEngineOutputDraft {
  primary: RecommendationDraft & { isPrimary?: true };
  alternatives: RecommendationDraft[];
}
