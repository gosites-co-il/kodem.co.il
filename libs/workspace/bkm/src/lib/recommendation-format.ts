import {
  createId,
  Recommendation,
  RecommendationDraft,
  WorkspaceId,
} from '@kodem/contracts';

export function prioritize(
  drafts: RecommendationDraft[],
): RecommendationDraft[] {
  const impactScore = { high: 3, medium: 2, low: 1 };
  return [...drafts].sort(
    (a, b) =>
      impactScore[b.expectedImpact] - impactScore[a.expectedImpact] ||
      a.priority - b.priority,
  );
}

export function toRecommendation(
  workspaceId: WorkspaceId,
  draft: RecommendationDraft,
): Recommendation {
  return {
    id: createId<'RecommendationId'>('rec'),
    workspaceId,
    action: draft.action,
    rationale: draft.rationale,
    expectedImpact: draft.expectedImpact,
    priority: draft.priority,
    isPrimary: draft.isPrimary ?? false,
    createdAt: new Date(),
  };
}

export function estimateImpact(action: string): 'low' | 'medium' | 'high' {
  const highKeywords = ['integration', 'lead', 'revenue', 'customer'];
  const mediumKeywords = ['profile', 'team', 'review'];
  const lower = action.toLowerCase();
  if (highKeywords.some((k) => lower.includes(k))) return 'high';
  if (mediumKeywords.some((k) => lower.includes(k))) return 'medium';
  return 'low';
}
