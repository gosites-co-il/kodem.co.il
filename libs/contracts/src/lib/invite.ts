import type { RoleName } from './role';
import type { UserId, WorkspaceId } from './ids';

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface WorkspaceInvite {
  id: string;
  workspaceId: WorkspaceId;
  email: string;
  role: RoleName;
  invitedById: UserId;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInviteInput {
  workspaceId: WorkspaceId;
  email: string;
  role: RoleName;
  invitedById: UserId;
}

export interface InviteMemberPreview {
  name: string;
  initials: string;
}

export interface InvitePublicView {
  id: string;
  workspaceName: string;
  workspaceSlug?: string;
  email: string;
  role: RoleName;
  status: InviteStatus;
  expiresAt: Date;
  invitedByName?: string;
  invitedByEmail?: string;
  memberCount?: number;
  membersPreview?: InviteMemberPreview[];
}

