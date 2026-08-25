import { Auditable } from './types';
import { UserId, WorkspaceId } from './ids';
import type { OnboardingStatus } from './onboarding';
import type { WorkspaceSetupData } from './workspace-setup';

/** Workspace lifecycle — independent of onboardingStatus. */
export type WorkspaceStatus = 'active' | 'suspended' | 'onboarding';

export interface Workspace extends Auditable {
  id: WorkspaceId;
  name: string;
  slug: string;
  ownerId: UserId;
  status: WorkspaceStatus;
  onboardingStatus: OnboardingStatus;
  onboardingStep: number;
  websiteUrl?: string;
  industry?: string;
  businessSize?: string;
  setupData?: WorkspaceSetupData;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  websiteUrl?: string;
  ownerEmail: string;
  ownerName: string;
}

export interface CreateWorkspaceForUserInput {
  name: string;
  slug: string;
  ownerId: UserId;
  websiteUrl?: string;
}
