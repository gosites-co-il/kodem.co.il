export type BiRecommendationType = 'module' | 'integration' | 'next_step';

export type BiRecommendationPriority = 'high' | 'medium' | 'low';

export interface BiRecommendation {
  type: BiRecommendationType;
  id: string;
  label: string;
  priority: BiRecommendationPriority;
  rationale: string;
  confidence: number;
}
