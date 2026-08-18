import type { BusinessReport, WorkspaceId } from '@kodem/contracts';

export function mapBusinessReportToPersistence(report: BusinessReport) {
  return {
    workspaceId: report.workspaceId,
    facts: JSON.stringify(report.facts),
    understanding: JSON.stringify(report.understanding),
    recommendations: JSON.stringify(report.recommendations),
    questions: JSON.stringify(report.questions),
    confidence: report.confidence,
    generatedAt: report.generatedAt,
    approvedAt: report.approvedAt ?? null,
  };
}

export function mapBusinessReportRowToDomain(row: {
  workspaceId: string;
  facts: string;
  understanding: string;
  recommendations: string;
  questions: string;
  confidence: number | null;
  generatedAt: Date;
  approvedAt: Date | null;
}): BusinessReport {
  return {
    workspaceId: row.workspaceId as WorkspaceId,
    facts: JSON.parse(row.facts),
    understanding: JSON.parse(row.understanding),
    recommendations: JSON.parse(row.recommendations),
    questions: JSON.parse(row.questions),
    confidence: row.confidence ?? 0,
    generatedAt: row.generatedAt,
    approvedAt: row.approvedAt ?? undefined,
  };
}
