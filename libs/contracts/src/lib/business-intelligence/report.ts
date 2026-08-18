import type { BusinessFact } from '../discovery/fact';
import type { WorkspaceId } from '../ids';
import type { BusinessUnderstanding } from './understanding';
import type { BiQuestion } from './questions';
import type { BiRecommendation } from './recommendations';

export interface BusinessReport {
  workspaceId: WorkspaceId;
  facts: BusinessFact[];
  understanding: BusinessUnderstanding;
  recommendations: BiRecommendation[];
  questions: BiQuestion[];
  confidence: number;
  generatedAt: Date;
  approvedAt?: Date;
}

export type UnderstandingFieldKey = keyof Omit<
  BusinessUnderstanding,
  'confidence' | 'missingInformation'
>;

export interface FieldApproval {
  approved: boolean;
  rejected: boolean;
  edited?: boolean;
}

/** In-flight report during onboarding — before persistence. */
export interface BusinessReportDraft extends BusinessReport {
  status: 'running' | 'completed' | 'failed' | 'partial';
  fieldApprovals?: Partial<Record<string, FieldApproval>>;
}
