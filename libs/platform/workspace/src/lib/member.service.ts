import {
  CreateInviteInput,
  InvitePublicView,
  INVITABLE_ROLES,
  Member,
  RoleName,
  UserId,
  WorkspaceId,
  WorkspaceInvite,
} from '@kodem/contracts';
import {
  MemberRepository,
  UserRepository,
  WorkspaceInviteRepository,
  WorkspaceRepository,
} from '@kodem/database';
import {
  generateRawToken,
  hashToken,
  RateLimitService,
} from '@kodem/platform/auth';
import { AuditService } from '@kodem/platform/audit';
import { NotificationService } from '@kodem/platform/notifications';
import { EntitlementsService } from '@kodem/platform/subscription';

export interface MemberListItem extends Member {
  email: string;
  name: string;
}

function inviteTtlMs(): number {
  const raw = process.env['INVITE_TOKEN_TTL'];
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 7 * 24 * 60 * 60 * 1000;
}

function isInvitableRole(role: RoleName): role is 'admin' | 'member' {
  return (INVITABLE_ROLES as RoleName[]).includes(role);
}

export class MemberService {
  private readonly memberRepo = new MemberRepository();
  private readonly inviteRepo = new WorkspaceInviteRepository();
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly userRepo = new UserRepository();
  private readonly notifications = new NotificationService();
  private readonly audit = new AuditService();
  private readonly entitlements = new EntitlementsService();
  private readonly inviteLimiter = new RateLimitService(20, 60 * 60 * 1000);

  async listMembers(workspaceId: WorkspaceId): Promise<MemberListItem[]> {
    const members = await this.memberRepo.listByWorkspace(workspaceId);
    const results: MemberListItem[] = [];

    for (const member of members) {
      const user = await this.userRepo.findById(member.userId);
      results.push({
        ...member,
        email: user?.email ?? '',
        name: user?.name ?? '',
      });
    }

    return results;
  }

  async inviteMember(
    input: CreateInviteInput,
  ): Promise<{ invite: WorkspaceInvite; rawToken: string }> {
    if (!isInvitableRole(input.role)) {
      throw new Error('Invites may only use admin or member roles');
    }

    const rateKey = `invite:${input.workspaceId}:${input.invitedById}`;
    const limit = this.inviteLimiter.check(rateKey);
    if (!limit.allowed) {
      throw new Error('Too many invites. Try again later.');
    }

    const workspace = await this.workspaceRepo.findById(input.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      const existingMember = await this.memberRepo.findByUserAndWorkspace(
        existingUser.id,
        input.workspaceId,
      );
      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }
    }

    const memberCount = await this.memberRepo.countByWorkspace(
      input.workspaceId,
    );
    const pendingCount = await this.inviteRepo.countPendingByWorkspace(
      input.workspaceId,
    );
    await this.entitlements.assertLimit(
      input.workspaceId,
      'members',
      memberCount + pendingCount,
    );

    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + inviteTtlMs());
    const invite = await this.inviteRepo.create({
      workspaceId: input.workspaceId,
      email,
      role: input.role,
      tokenHash: hashToken(rawToken),
      invitedById: input.invitedById,
      expiresAt,
    });

    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    await this.notifications.notify({
      type: 'workspace.invite',
      to: email,
      subject: `You're invited to ${workspace.name} on Kodem`,
      workspaceId: input.workspaceId,
      userId: input.invitedById,
      data: {
        workspaceName: workspace.name,
        role: input.role,
        inviteUrl: `${appUrl}/invite/${encodeURIComponent(rawToken)}`,
      },
    });

    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: input.invitedById,
      targetId: invite.id,
      action: 'workspace.member.invited',
      metadata: { email, role: input.role },
    });

    return { invite, rawToken };
  }

  async resendInvite(
    inviteId: string,
    actorId: UserId,
  ): Promise<{ invite: WorkspaceInvite; rawToken: string }> {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }
    if (invite.status !== 'pending') {
      throw new Error('Invite is no longer pending');
    }

    const rateKey = `invite:${invite.workspaceId}:${actorId}`;
    const limit = this.inviteLimiter.check(rateKey);
    if (!limit.allowed) {
      throw new Error('Too many invites. Try again later.');
    }

    const workspace = await this.workspaceRepo.findById(invite.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + inviteTtlMs());
    const updated = await this.inviteRepo.updateToken(invite.id, {
      tokenHash: hashToken(rawToken),
      expiresAt,
    });

    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    await this.notifications.notify({
      type: 'workspace.invite',
      to: invite.email,
      subject: `You're invited to ${workspace.name} on Kodem`,
      workspaceId: invite.workspaceId,
      userId: actorId,
      data: {
        workspaceName: workspace.name,
        role: invite.role,
        inviteUrl: `${appUrl}/invite/${encodeURIComponent(rawToken)}`,
      },
    });

    return { invite: updated, rawToken };
  }

  async getInvitePublic(rawToken: string): Promise<InvitePublicView> {
    const invite = await this.inviteRepo.findByTokenHash(hashToken(rawToken));
    if (!invite) {
      throw new Error('Invite not found');
    }

    const workspace = await this.workspaceRepo.findById(invite.workspaceId);
    if (!workspace) {
      throw new Error('Invite not found');
    }

    let status = invite.status;
    if (status === 'pending' && invite.expiresAt.getTime() < Date.now()) {
      status = 'expired';
    }

    return {
      id: invite.id,
      workspaceName: workspace.name,
      email: invite.email,
      role: invite.role,
      status,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(
    rawToken: string,
    userId: UserId,
    options?: { switchActive?: boolean },
  ): Promise<Member> {
    const invite = await this.inviteRepo.findByTokenHash(hashToken(rawToken));
    if (!invite) {
      throw new Error('Invite not found');
    }
    if (invite.status !== 'pending') {
      throw new Error('Invite is no longer valid');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await this.inviteRepo.updateStatus(invite.id, 'expired');
      throw new Error('Invite has expired');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error('Invite email does not match the signed-in user');
    }

    const existing = await this.memberRepo.findByUserAndWorkspace(
      userId,
      invite.workspaceId,
    );
    if (existing) {
      await this.inviteRepo.markAccepted(invite.id);
      return existing;
    }

    const memberCount = await this.memberRepo.countByWorkspace(
      invite.workspaceId,
    );
    await this.entitlements.assertLimit(
      invite.workspaceId,
      'members',
      memberCount,
    );

    const member = await this.memberRepo.create({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
    });
    await this.inviteRepo.markAccepted(invite.id);

    if (options?.switchActive !== false) {
      await this.userRepo.setActiveWorkspace(userId, invite.workspaceId);
    }

    await this.audit.record({
      workspaceId: invite.workspaceId,
      actorId: userId,
      targetId: member.id,
      action: 'workspace.member.joined',
      metadata: { email: user.email, role: invite.role },
    });

    return member;
  }

  async changeRole(
    workspaceId: WorkspaceId,
    targetUserId: UserId,
    newRole: RoleName,
    actorId: UserId,
  ): Promise<Member> {
    if (newRole === 'owner') {
      throw new Error('Use transferOwnership to assign the owner role');
    }

    const target = await this.memberRepo.findByUserAndWorkspace(
      targetUserId,
      workspaceId,
    );
    if (!target) {
      throw new Error('Member not found');
    }

    if (target.role === 'owner') {
      const owners = await this.memberRepo.countOwners(workspaceId);
      if (owners <= 1) {
        throw new Error('Cannot demote the last owner');
      }
    }

    const updated = await this.memberRepo.updateRole(
      workspaceId,
      targetUserId,
      newRole,
    );

    await this.audit.record({
      workspaceId,
      actorId,
      targetId: targetUserId,
      action: 'workspace.member.role_changed',
      metadata: { from: target.role, to: newRole },
    });

    return updated;
  }

  async removeMember(
    workspaceId: WorkspaceId,
    targetUserId: UserId,
    actorId: UserId,
  ): Promise<void> {
    const target = await this.memberRepo.findByUserAndWorkspace(
      targetUserId,
      workspaceId,
    );
    if (!target) {
      throw new Error('Member not found');
    }

    if (target.role === 'owner') {
      const owners = await this.memberRepo.countOwners(workspaceId);
      if (owners <= 1) {
        throw new Error('Cannot remove the last owner');
      }
    }

    await this.memberRepo.delete(workspaceId, targetUserId);
    await this.audit.record({
      workspaceId,
      actorId,
      targetId: targetUserId,
      action: 'workspace.member.removed',
    });
  }

  async leaveWorkspace(
    workspaceId: WorkspaceId,
    userId: UserId,
  ): Promise<void> {
    const membership = await this.memberRepo.findByUserAndWorkspace(
      userId,
      workspaceId,
    );
    if (!membership) {
      throw new Error('Not a member of this workspace');
    }

    if (membership.role === 'owner') {
      const owners = await this.memberRepo.countOwners(workspaceId);
      if (owners <= 1) {
        throw new Error(
          'Owners must transfer ownership or deactivate the workspace before leaving',
        );
      }
    }

    await this.memberRepo.delete(workspaceId, userId);
    await this.audit.record({
      workspaceId,
      actorId: userId,
      targetId: userId,
      action: 'workspace.left',
    });
  }

  async transferOwnership(
    workspaceId: WorkspaceId,
    fromUserId: UserId,
    toUserId: UserId,
  ): Promise<void> {
    const from = await this.memberRepo.findByUserAndWorkspace(
      fromUserId,
      workspaceId,
    );
    if (!from || from.role !== 'owner') {
      throw new Error('Only the current owner can transfer ownership');
    }

    const to = await this.memberRepo.findByUserAndWorkspace(
      toUserId,
      workspaceId,
    );
    if (!to) {
      throw new Error('Target user is not a member of this workspace');
    }

    await this.memberRepo.updateRole(workspaceId, toUserId, 'owner');
    await this.memberRepo.updateRole(workspaceId, fromUserId, 'admin');
    await this.workspaceRepo.updateOwner(workspaceId, toUserId);

    await this.audit.record({
      workspaceId,
      actorId: fromUserId,
      targetId: toUserId,
      action: 'workspace.owner.transferred',
    });
  }

  async deactivateWorkspace(
    workspaceId: WorkspaceId,
    actorId: UserId,
  ): Promise<void> {
    await this.workspaceRepo.updateStatus(workspaceId, 'deactivated');
    await this.audit.record({
      workspaceId,
      actorId,
      action: 'workspace.deactivated',
    });
  }

  async listPendingInvites(
    workspaceId: WorkspaceId,
  ): Promise<WorkspaceInvite[]> {
    const invites = await this.inviteRepo.listByWorkspace(workspaceId);
    return invites.filter((i) => i.status === 'pending');
  }
}
