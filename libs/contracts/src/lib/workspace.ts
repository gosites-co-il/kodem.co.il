import { Auditable } from './types';
import { UserId, WorkspaceId } from './ids';

export type WorkspaceStatus = 'active' | 'onboarding' | 'suspended';

export interface Workspace extends Auditable {
  id: WorkspaceId;
  name: string;
  slug: string;
  ownerId: UserId;
  status: WorkspaceStatus;
  websiteUrl?: string;
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
