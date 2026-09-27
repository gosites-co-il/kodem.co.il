import { Member, MemberId, User, Workspace } from '@kodem/contracts';
import type { ResolvedWorkspace } from '@kodem/platform/workspace';

const IMPERSONATION_MEMBER_ID = 'mem_platform_impersonation' as MemberId;

/** Session context for a platform super admin operating inside a workspace. */
export function buildImpersonationContext(
  user: User,
  workspace: Workspace,
): ResolvedWorkspace {
  const now = new Date();
  const membership: Member = {
    id: IMPERSONATION_MEMBER_ID,
    workspaceId: workspace.id,
    userId: user.id,
    role: 'super_admin',
    createdAt: now,
    updatedAt: now,
  };
  return { workspace, membership, role: 'super_admin' };
}
