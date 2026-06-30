import { Auditable } from './types';
import { WorkspaceId } from './ids';

export type WorkspaceStatus = 'active' | 'onboarding' | 'suspended';

export interface Workspace extends Auditable {
  id: WorkspaceId;
  name: string;
  slug: string;
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
