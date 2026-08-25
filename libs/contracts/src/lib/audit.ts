import type { UserId, WorkspaceId } from './ids';

export type AuditAction =
  | 'workspace.member.invited'
  | 'workspace.member.joined'
  | 'workspace.member.removed'
  | 'workspace.member.role_changed'
  | 'workspace.owner.transferred'
  | 'workspace.deactivated'
  | 'workspace.left'
  | 'subscription.plan_changed'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  | 'auth.email_verified';

export interface AuditEvent {
  id: string;
  workspaceId?: WorkspaceId | null;
  actorId?: UserId | null;
  targetId?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateAuditEventInput {
  workspaceId?: WorkspaceId | null;
  actorId?: UserId | null;
  targetId?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}
