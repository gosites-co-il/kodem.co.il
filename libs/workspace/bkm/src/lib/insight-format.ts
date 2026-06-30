import {
  createId,
  Insight,
  InsightDraft,
  WorkspaceId,
} from '@kodem/contracts';

export function formatInsight(insight: Insight): string {
  return `**${insight.title}**\n${insight.what}\n\n*Why it matters:* ${insight.why}\n*Confidence:* ${Math.round(insight.confidence * 100)}%`;
}

export function toInsight(
  workspaceId: WorkspaceId,
  draft: InsightDraft,
): Insight {
  return {
    id: createId<'InsightId'>('ins'),
    workspaceId,
    ...draft,
    createdAt: new Date(),
  };
}

export function aggregateInsights(insights: Insight[]): {
  count: number;
  avgConfidence: number;
  topTitles: string[];
} {
  if (insights.length === 0) {
    return { count: 0, avgConfidence: 0, topTitles: [] };
  }
  const avgConfidence =
    insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
  const topTitles = [...insights]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((i) => i.title);
  return { count: insights.length, avgConfidence, topTitles };
}
