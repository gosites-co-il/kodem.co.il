import { Insight, Recommendation, WorkspaceId } from '@kodem/contracts';

type InsightRow = {
  id: string;
  workspaceId: string;
  title: string;
  what: string;
  why: string;
  confidence: number;
  supportingData: string;
  createdAt: Date;
};

type RecommendationRow = {
  id: string;
  workspaceId: string;
  action: string;
  rationale: string;
  expectedImpact: string;
  priority: number;
  isPrimary: boolean;
  createdAt: Date;
};

export function mapInsightRowToDomain(row: InsightRow): Insight {
  return {
    id: row.id as Insight['id'],
    workspaceId: row.workspaceId as WorkspaceId,
    title: row.title,
    what: row.what,
    why: row.why,
    confidence: row.confidence,
    supportingData: JSON.parse(row.supportingData),
    createdAt: row.createdAt,
  };
}

export function mapInsightToPersistence(insight: Insight) {
  return {
    id: insight.id,
    workspaceId: insight.workspaceId,
    title: insight.title,
    what: insight.what,
    why: insight.why,
    confidence: insight.confidence,
    supportingData: JSON.stringify(insight.supportingData),
    createdAt: insight.createdAt,
  };
}

export function mapRecommendationRowToDomain(row: RecommendationRow): Recommendation {
  return {
    id: row.id as Recommendation['id'],
    workspaceId: row.workspaceId as WorkspaceId,
    action: row.action,
    rationale: row.rationale,
    expectedImpact: row.expectedImpact as Recommendation['expectedImpact'],
    priority: row.priority,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
  };
}

export function mapRecommendationToPersistence(recommendation: Recommendation) {
  return {
    id: recommendation.id,
    workspaceId: recommendation.workspaceId,
    action: recommendation.action,
    rationale: recommendation.rationale,
    expectedImpact: recommendation.expectedImpact,
    priority: recommendation.priority,
    isPrimary: recommendation.isPrimary,
    createdAt: recommendation.createdAt,
  };
}
