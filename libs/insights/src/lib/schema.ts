import { InsightId, WorkspaceId } from '@kodem/core';

export interface Insight {
  id: InsightId;
  workspaceId: WorkspaceId;
  title: string;
  what: string;
  why: string;
  confidence: number;
  supportingData: Record<string, unknown>;
  createdAt: Date;
}

export interface InsightDraft {
  title: string;
  what: string;
  why: string;
  confidence: number;
  supportingData: Record<string, unknown>;
}
