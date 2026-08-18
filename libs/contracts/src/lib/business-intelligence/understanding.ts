/** AI-generated business understanding with per-field confidence. */
export interface UnderstandingField<T = string> {
  value: T;
  confidence: number;
  source: 'ai' | 'facts';
}

export interface BusinessUnderstanding {
  businessSummary: UnderstandingField;
  industry: UnderstandingField;
  subIndustry?: UnderstandingField;
  businessModel: UnderstandingField;
  targetAudience: UnderstandingField;
  idealCustomer: UnderstandingField;
  mainServices: UnderstandingField<string[]>;
  products: UnderstandingField<string[]>;
  uniqueSellingProposition: UnderstandingField;
  competitiveAdvantages: UnderstandingField<string[]>;
  brandVoice: UnderstandingField;
  keywords: UnderstandingField<string[]>;
  customerJourney: UnderstandingField;
  marketingChannels: UnderstandingField<string[]>;
  primaryGoals?: UnderstandingField<string[]>;
  businessChallenges?: UnderstandingField<string[]>;
  marketingStrategy?: UnderstandingField;
  confidence: number;
  missingInformation: string[];
}

/** Raw structured JSON shape returned by the AI (no markdown). */
export interface AiUnderstandingOutput {
  businessSummary: string;
  industry: string;
  subIndustry?: string;
  businessModel: string;
  targetAudience: string;
  idealCustomer: string;
  mainServices: string[];
  products: string[];
  uniqueSellingProposition: string;
  competitiveAdvantages: string[];
  brandVoice: string;
  keywords: string[];
  customerJourney: string;
  marketingChannels: string[];
  suggestedIntegrations: string[];
  suggestedKodemModules: string[];
  confidence: number;
  missingInformation: string[];
  questionsForBusinessOwner: Array<{
    question: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}
