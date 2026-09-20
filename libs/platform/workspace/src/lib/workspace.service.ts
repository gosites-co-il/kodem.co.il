import {
  UserId,
  WorkspaceId,
  Member,
  SETUP_JOURNEY_VERSION,
  requiresOnboarding,
} from '@kodem/contracts';
import {
  WorkspaceRepository,
  MemberRepository,
  UserRepository,
} from '@kodem/database';
import { SubscriptionService, EntitlementsService } from '@kodem/platform/subscription';
import {
  WorkspaceResolver,
  ResolvedWorkspace,
  slugify,
} from './workspace.resolver';
import { WorkspaceModuleService } from './workspace-module.service';

export class WorkspaceService {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly memberRepo = new MemberRepository();
  private readonly userRepo = new UserRepository();
  private readonly resolver = new WorkspaceResolver();
  private readonly subscriptions = new SubscriptionService();
  private readonly modules = new WorkspaceModuleService();
  private readonly entitlements = new EntitlementsService();

  async getCurrentForUser(userId: UserId): Promise<ResolvedWorkspace | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) return null;
    return this.resolver.resolveForUser(user);
  }

  async createForOwner(
    userId: UserId,
    input: { name: string; slug?: string; websiteUrl?: string },
  ): Promise<ResolvedWorkspace> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingMemberships = await this.listForUser(userId);
    // Incomplete (mid-setup) workspaces must not block starting another client.
    const completedCount = existingMemberships.filter(
      (m) => !requiresOnboarding(m.workspace),
    ).length;
    const referenceWorkspaceId =
      existingMemberships[0]?.workspace.id ??
      ((await this.userRepo.getActiveWorkspaceId(userId)) as WorkspaceId | null);
    if (referenceWorkspaceId) {
      await this.entitlements.assertLimit(
        referenceWorkspaceId,
        'workspaces',
        completedCount,
      );
    }

    let slug = input.slug?.trim()
      ? slugify(input.slug)
      : slugify(input.name || `ws-${Date.now().toString(36)}`);
    // Guarantee a valid unique slug even for non-Latin names.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2) {
      slug = `ws-${crypto.randomUUID().slice(0, 10)}`;
    }
    const existing = await this.workspaceRepo.findBySlug(slug);
    if (existing) {
      slug = `ws-${crypto.randomUUID().slice(0, 10)}`;
    }

    const { workspace, memberId } = await this.workspaceRepo.createForUser({
      name: input.name,
      slug,
      ownerId: userId,
      websiteUrl: input.websiteUrl,
      setupData: {
        setupJourneyVersion: SETUP_JOURNEY_VERSION,
        // Same blank identity path as start-over — no corporate-email peek.
        identityMode: 'manual',
      },
    });

    await this.userRepo.setActiveWorkspace(userId, workspace.id);
    await this.subscriptions.ensureForWorkspace(workspace.id);
    await this.modules.enableDefaultFreeModules(workspace.id);

    return {
      workspace,
      membership: {
        id: memberId,
        workspaceId: workspace.id,
        userId,
        role: 'owner',
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      role: 'owner',
    };
  }

  async findById(id: WorkspaceId): Promise<import('@kodem/contracts').Workspace | null> {
    return this.workspaceRepo.findById(id);
  }

  async assertMembership(
    userId: UserId,
    workspaceId: WorkspaceId,
  ): Promise<Member> {
    const membership = await this.memberRepo.findByUserAndWorkspace(
      userId,
      workspaceId,
    );
    if (!membership) {
      throw new Error('User is not a member of this workspace');
    }
    return membership;
  }

  async listForUser(userId: UserId): Promise<
    Array<{
      workspace: import('@kodem/contracts').Workspace;
      role: import('@kodem/contracts').RoleName;
      membership: Member;
    }>
  > {
    const memberships = await this.memberRepo.findByUserId(userId);
    const results = [];

    for (const membership of memberships) {
      const workspace = await this.workspaceRepo.findById(membership.workspaceId);
      if (workspace) {
        results.push({
          workspace,
          role: membership.role,
          membership,
        });
      }
    }

    return results;
  }

  async switchTo(
    userId: UserId,
    workspaceId: WorkspaceId,
  ): Promise<ResolvedWorkspace> {
    const membership = await this.assertMembership(userId, workspaceId);
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.userRepo.setActiveWorkspace(userId, workspaceId);

    return {
      workspace,
      membership,
      role: membership.role,
    };
  }
}

export type { ResolvedWorkspace };
export { WorkspaceResolver } from './workspace.resolver';
