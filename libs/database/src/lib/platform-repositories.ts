import {
  User,
  UserId,
  Member,
  MemberId,
  WorkspaceId,
  RoleName,
  OAuthAccount,
  OAuthProvider,
  createId,
} from '@kodem/contracts';
import { getPrismaClient } from './client';
import { mapUserRowToDomain } from './mappers/user.mapper';
import { mapMemberRowToDomain } from './mappers/member.mapper';
import { mapOAuthAccountRowToDomain } from './mappers/oauth.mapper';

export class UserRepository {
  private readonly db = getPrismaClient();

  async create(input: {
    email: string;
    name: string;
    passwordHash?: string;
  }): Promise<User> {
    const id = createId<'UserId'>('usr');
    const now = new Date();
    const row = await this.db.user.create({
      data: {
        id,
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: input.passwordHash,
      },
    });
    return mapUserRowToDomain(row);
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? mapUserRowToDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return row ? mapUserRowToDomain(row) : null;
  }

  async findByEmailWithPassword(email: string): Promise<{
    user: User;
    passwordHash: string | null;
  } | null> {
    const row = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!row) return null;
    return {
      user: mapUserRowToDomain(row),
      passwordHash: row.passwordHash,
    };
  }

  async setActiveWorkspace(
    userId: UserId,
    workspaceId: WorkspaceId,
  ): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { activeWorkspaceId: workspaceId },
    });
  }

  async getActiveWorkspaceId(userId: UserId): Promise<WorkspaceId | null> {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      select: { activeWorkspaceId: true },
    });
    return (row?.activeWorkspaceId as WorkspaceId) ?? null;
  }
}

export class MemberRepository {
  private readonly db = getPrismaClient();

  async create(input: {
    workspaceId: WorkspaceId;
    userId: UserId;
    role: RoleName;
  }): Promise<Member> {
    const id = createId<'MemberId'>('mem');
    const row = await this.db.member.create({
      data: {
        id,
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
      },
    });
    return mapMemberRowToDomain(row);
  }

  async findByUserAndWorkspace(
    userId: UserId,
    workspaceId: WorkspaceId,
  ): Promise<Member | null> {
    const row = await this.db.member.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    return row ? mapMemberRowToDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<Member[]> {
    const rows = await this.db.member.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(mapMemberRowToDomain);
  }

  async countByUserId(userId: UserId): Promise<number> {
    return this.db.member.count({ where: { userId } });
  }
}

export class OAuthAccountRepository {
  private readonly db = getPrismaClient();

  async findByProvider(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<OAuthAccount | null> {
    const row = await this.db.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
    });
    return row ? mapOAuthAccountRowToDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<OAuthAccount[]> {
    const rows = await this.db.oAuthAccount.findMany({
      where: { userId },
    });
    return rows.map(mapOAuthAccountRowToDomain);
  }

  async create(input: {
    provider: OAuthProvider;
    providerUserId: string;
    email: string;
    userId: UserId;
  }): Promise<OAuthAccount> {
    const id = `oauth_${crypto.randomUUID()}`;
    const row = await this.db.oAuthAccount.create({
      data: {
        id,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email.toLowerCase(),
        userId: input.userId,
      },
    });
    return mapOAuthAccountRowToDomain(row);
  }

  async linkToUser(
    provider: OAuthProvider,
    providerUserId: string,
    userId: UserId,
    email: string,
  ): Promise<OAuthAccount> {
    const existing = await this.findByProvider(provider, providerUserId);
    if (existing) {
      if (existing.userId !== userId) {
        throw new Error(
          `OAuth account ${provider}:${providerUserId} is already linked to another user`,
        );
      }
      return existing;
    }
    return this.create({ provider, providerUserId, email, userId });
  }
}
