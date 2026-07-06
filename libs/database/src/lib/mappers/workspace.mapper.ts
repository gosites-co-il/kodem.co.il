import { Workspace, WorkspaceId, UserId } from '@kodem/contracts';
import type { OnboardingStatus, WorkspaceSetupData } from '@kodem/contracts';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: string;
  onboardingStatus: string;
  onboardingStep: number;
  websiteUrl: string | null;
  industry: string | null;
  businessSize: string | null;
  setupData: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function parseSetupData(raw: string | null): WorkspaceSetupData | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as WorkspaceSetupData;
  } catch {
    return undefined;
  }
}

export function mapWorkspaceRowToDomain(row: WorkspaceRow): Workspace {
  return {
    id: row.id as WorkspaceId,
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId as UserId,
    status: row.status as Workspace['status'],
    onboardingStatus: row.onboardingStatus as OnboardingStatus,
    onboardingStep: row.onboardingStep,
    websiteUrl: row.websiteUrl ?? undefined,
    industry: row.industry ?? undefined,
    businessSize: row.businessSize ?? undefined,
    setupData: parseSetupData(row.setupData),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeSetupData(
  data: WorkspaceSetupData | undefined,
): string | null {
  if (!data || Object.keys(data).length === 0) return null;
  return JSON.stringify(data);
}
