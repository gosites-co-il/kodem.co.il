import {
  UserId,
  WorkspaceId,
  Member,
} from '@kodem/contracts';
import {
  WorkspaceRepository,
  MemberRepository,
  UserRepository,
} from '@kodem/database';
import {
  WorkspaceResolver,
  ResolvedWorkspace,
  slugify,
} from './workspace.resolver';

export class WorkspaceService {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly memberRepo = new MemberRepository();
  private readonly userRepo = new UserRepository();
  private readonly resolver = new WorkspaceResolver();

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

    const slug = input.slug ?? slugify(input.name);
    const existing = await this.workspaceRepo.findBySlug(slug);
    if (existing) {
      throw new Error(`Workspace slug "${slug}" already exists`);
    }

    const { workspace, memberId } = await this.workspaceRepo.createForUser({
      name: input.name,
      slug,
      ownerId: userId,
      websiteUrl: input.websiteUrl,
    });

    await this.userRepo.setActiveWorkspace(userId, workspace.id);

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
}

export type { ResolvedWorkspace };
export { WorkspaceResolver } from './workspace.resolver';
