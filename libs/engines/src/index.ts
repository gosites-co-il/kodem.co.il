import { DiscoveryEngine } from './lib/discovery/discovery.engine';
import { InsightEngine } from './lib/insight/insight.engine';
import { RecommendationEngine } from './lib/recommendation/recommendation.engine';
import { RuleEngine } from './lib/rule/rule.engine';
import { LearningEngine } from './lib/learning/learning.engine';

export * from './lib/types';
export * from './lib/pipeline';
export * from './lib/discovery/discovery.engine';
export * from './lib/insight/insight.engine';
export * from './lib/recommendation/recommendation.engine';
export * from './lib/rule/rule.engine';
export * from './lib/learning/learning.engine';

export const ENGINES = {
  discovery: DiscoveryEngine,
  insight: InsightEngine,
  recommendation: RecommendationEngine,
  rule: RuleEngine,
  learning: LearningEngine,
} as const;
