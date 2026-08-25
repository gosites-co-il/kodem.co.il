import {
  User,
  Workspace,
  CreateWorkspaceForUserInput,
  RoleName,
  Member,
} from '@kodem/contracts';
import {
  WorkspaceRepository,
  MemberRepository,
  UserRepository,
} from '@kodem/database';
import { SubscriptionService } from '@kodem/platform/subscription';
import { WorkspaceModuleService } from './workspace-module.service';

export interface ResolvedWorkspace {
  workspace: Workspace;
  membership: Member;
  role: RoleName;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export { slugify };

export class WorkspaceResolver {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly memberRepo = new MemberRepository();
  private readonly userRepo = new UserRepository();
  private readonly subscriptions = new SubscriptionService();
  private readonly modules = new WorkspaceModuleService();

  async resolveForUser(user: User): Promise<ResolvedWorkspace> {
    const memberships = await this.memberRepo.findByUserId(user.id);

    if (memberships.length === 0) {
      return this.createDefaultWorkspace(user);
    }

    if (memberships.length === 1) {
      const membership = memberships[0];
      const workspace = await this.workspaceRepo.findById(membership.workspaceId);
      if (!workspace) {
        throw new Error('Membership references missing workspace');
      }
      await this.ensurePlatformState(workspace);
      await this.userRepo.setActiveWorkspace(user.id, workspace.id);
      return { workspace, membership, role: membership.role };
    }

    const activeId = await this.userRepo.getActiveWorkspaceId(user.id);
    const activeMembership =
      (activeId &&
        memberships.find((m) => m.workspaceId === activeId)) ||
      memberships[0];

    const workspace = await this.workspaceRepo.findById(
      activeMembership.workspaceId,
    );
    if (!workspace) {
      throw new Error('Membership references missing workspace');
    }

    await this.ensurePlatformState(workspace);
    await this.userRepo.setActiveWorkspace(user.id, workspace.id);
    return {
      workspace,
      membership: activeMembership,
      role: activeMembership.role,
    };
  }

  private async ensurePlatformState(workspace: Workspace): Promise<void> {
    await this.subscriptions.ensureForWorkspace(workspace.id);
    const existing = await this.modules.list(workspace.id);
    if (existing.length === 0) {
      await this.modules.migrateFromSetupData(workspace);
      const after = await this.modules.list(workspace.id);
      if (after.length === 0) {
        await this.modules.enableDefaultFreeModules(workspace.id);
      }
    }
  }

  private async createDefaultWorkspace(
    user: User,
  ): Promise<ResolvedWorkspace> {
    const input: CreateWorkspaceForUserInput = {
      name: `${user.name}'s Workspace`,
      slug: slugify(user.name || user.email),
      ownerId: user.id,
    };

    const { workspace, memberId } =
      await this.workspaceRepo.createForUser(input);

    await this.ensurePlatformState(workspace);

    return {
      workspace,
      membership: {
        id: memberId,
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      role: 'owner',
    };
  }
}
