import { RecommendationId, WorkspaceId } from '@kodem/core';

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
