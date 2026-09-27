import { UserId, WorkspaceId } from '@kodem/contracts';
import { getPrismaClient } from './client';
import { mapWorkspaceRowToDomain } from './mappers/workspace.mapper';

export interface AdminWorkspaceRow {
  workspace: ReturnType<typeof mapWorkspaceRowToDomain>;
  owner: { id: UserId; email: string; name: string };
  memberCount: number;
}

export class AdminRepository {
  private readonly db = getPrismaClient();

  async listWorkspaces(): Promise<AdminWorkspaceRow[]> {
    const rows = await this.db.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        owner: true,
        _count: { select: { members: true } },
      },
    });

    return rows.map((row) => ({
      workspace: mapWorkspaceRowToDomain(row),
      owner: {
        id: row.owner.id as UserId,
        email: row.owner.email,
        name: row.owner.name,
      },
      memberCount: row._count.members,
    }));
  }

  async countOwnedWorkspaces(userId: UserId): Promise<number> {
    return this.db.workspace.count({ where: { ownerId: userId } });
  }

  async deleteWorkspace(workspaceId: WorkspaceId): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { activeWorkspaceId: workspaceId },
        data: { activeWorkspaceId: null },
      });
      await tx.user.updateMany({
        where: { impersonatingWorkspaceId: workspaceId },
        data: { impersonatingWorkspaceId: null },
      });

      await tx.channelConnectionBinding.deleteMany({
        where: {
          OR: [
            { channel: { workspaceId } },
            { connection: { workspaceId } },
          ],
        },
      });
      await tx.connectionCredential.deleteMany({
        where: { connection: { workspaceId } },
      });
      await tx.workspaceConnection.deleteMany({
        where: { workspaceId },
      });
      await tx.workspaceChannel.deleteMany({ where: { workspaceId } });

      await tx.crmBoardItem.deleteMany({ where: { workspaceId } });
      await tx.crmTask.deleteMany({ where: { workspaceId } });
      await tx.crmLead.deleteMany({ where: { workspaceId } });
      await tx.crmContact.deleteMany({ where: { workspaceId } });
      await tx.crmBoardColumn.deleteMany({ where: { workspaceId } });
      await tx.crmBoard.deleteMany({ where: { workspaceId } });

      await tx.insightRecord.deleteMany({ where: { workspaceId } });
      await tx.recommendationRecord.deleteMany({ where: { workspaceId } });
      await tx.businessReport.deleteMany({ where: { workspaceId } });
      await tx.businessProfile.deleteMany({ where: { workspaceId } });
      await tx.event.deleteMany({ where: { workspaceId } });
      await tx.usageEvent.deleteMany({ where: { workspaceId } });
      await tx.auditEvent.deleteMany({ where: { workspaceId } });
      await tx.notificationOutbox.deleteMany({ where: { workspaceId } });
      await tx.featureFlagOverride.deleteMany({ where: { workspaceId } });
      await tx.workspaceModule.deleteMany({ where: { workspaceId } });
      await tx.subscription.deleteMany({ where: { workspaceId } });
      await tx.workspaceInvite.deleteMany({ where: { workspaceId } });
      await tx.member.deleteMany({ where: { workspaceId } });
      await tx.workspace.delete({ where: { id: workspaceId } });
    });
  }

  async deleteUser(userId: UserId, reassignCreatedById: UserId): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.auditEvent.updateMany({
        where: { actorId: userId },
        data: { actorId: null },
      });
      await tx.workspaceInvite.deleteMany({ where: { invitedById: userId } });
      await tx.workspaceConnection.updateMany({
        where: { createdById: userId },
        data: { createdById: reassignCreatedById },
      });
      await tx.authToken.deleteMany({ where: { userId } });
      await tx.oAuthAccount.deleteMany({ where: { userId } });
      await tx.legalConsent.deleteMany({ where: { userId } });
      await tx.member.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
