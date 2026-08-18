import type { BiRecommendationPriority } from './recommendations';

export interface BiQuestion {
  id: string;
  question: string;
  reason: string;
  priority: BiRecommendationPriority;
}
