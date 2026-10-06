import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUpsertWorkspaceInput,
  AdminUserListItem,
  AdminWorkspaceDetail,
  AdminWorkspaceListItem,
  PlanId,
  RoleName,
  ONBOARDING_STATUSES,
  PLATFORM_WORKSPACE_SLUG,
  SystemRole,
  User,
  UserId,
  Workspace,
  WorkspaceId,
  WorkspaceStatus,
} from '@kodem/contracts';
import type { OnboardingStatus } from '@kodem/contracts';
import {
  AdminRepository,
  MemberRepository,
  UserRepository,
  WorkspaceInviteRepository,
  WorkspaceRepository,
} from '@kodem/database';
import { isPlatformSuperAdminEmail } from '@kodem/platform/auth';
import { SubscriptionService } from '@kodem/platform/subscription';
import { WorkspaceModuleService, WorkspaceService } from '@kodem/platform/workspace';

const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  'active',
  'suspended',
  'onboarding',
  'deactivated',
];

@Injectable()
export class AdminService {
  private readonly adminRepo = new AdminRepository();
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly userRepo = new UserRepository();
  private readonly memberRepo = new MemberRepository();
  private readonly inviteRepo = new WorkspaceInviteRepository();
  private readonly workspaceService = new WorkspaceService();
  private readonly subscriptions = new SubscriptionService();
  private readonly modules = new WorkspaceModuleService();

  async listWorkspaces(): Promise<{ workspaces: AdminWorkspaceListItem[] }> {
    const rows = await this.adminRepo.listWorkspaces();
    return {
      workspaces: rows.map((row) => ({
        ...row,
        protected: row.workspace.slug === PLATFORM_WORKSPACE_SLUG,
      })),
    };
  }

  async createWorkspace(input: {
    name: string;
    slug?: string;
    websiteUrl?: string;
    ownerEmail: string;
    status?: WorkspaceStatus;
    onboardingStatus?: OnboardingStatus;
  }): Promise<AdminWorkspaceListItem> {
    const name = input.name.trim();
    if (!name) throw new Error('חסר שם סביבה');

    const owner = await this.requireUserByEmail(input.ownerEmail);
    const [slug, previousActive] = await Promise.all([
      this.uniqueSlug(input.slug?.trim() || name),
      this.userRepo.getActiveWorkspaceId(owner.id),
    ]);

    const created = await this.workspaceRepo.createForUser({
      name,
      slug,
      ownerId: owner.id,
      websiteUrl: blankToUndefined(input.websiteUrl),
    });

    if (previousActive) {
      await this.userRepo.setActiveWorkspace(owner.id, previousActive);
    }

    const status = isWorkspaceStatus(input.status) ? input.status : 'active';
    const onboardingStatus = isOnboardingStatus(input.onboardingStatus)
      ? input.onboardingStatus
      : 'COMPLETED';

    await this.workspaceRepo.updateOnboarding(created.workspace.id, {
      status,
      onboardingStatus,
    });
    await this.subscriptions.ensureForWorkspace(created.workspace.id);
    await this.modules.enableDefaultFreeModules(created.workspace.id);

    return this.workspaceItem(created.workspace.id);
  }

  async updateWorkspace(
    id: WorkspaceId,
    input: AdminUpsertWorkspaceInput,
  ): Promise<AdminWorkspaceListItem> {
    const existing = await this.workspaceRepo.findById(id);
    if (!existing) throw new Error('הסביבה לא נמצאה');

    const data: {
      name?: string;
      slug?: string;
      websiteUrl?: string | null;
      industry?: string | null;
      businessSize?: string | null;
      status?: string;
      onboardingStatus?: string;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error('חסר שם סביבה');
      data.name = name;
    }
    if (input.slug !== undefined) {
      const slug = normalizeSlug(input.slug);
      if (!isValidSlug(slug)) {
        throw new Error('המזהה יכול להכיל רק אותיות באנגלית, מספרים ומקפים');
      }
      const taken = await this.workspaceRepo.findBySlug(slug);
      if (taken && taken.id !== id) throw new Error('המזהה כבר בשימוש');
      data.slug = slug;
    }
    if (input.websiteUrl !== undefined) {
      data.websiteUrl = input.websiteUrl?.trim() || null;
    }
    if (input.industry !== undefined) {
      data.industry = input.industry?.trim() || null;
    }
    if (input.businessSize !== undefined) {
      data.businessSize = input.businessSize?.trim() || null;
    }
    if (input.status !== undefined) {
      if (!isWorkspaceStatus(input.status)) throw new Error('סטטוס לא תקין');
      data.status = input.status;
    }
    if (input.onboardingStatus !== undefined) {
      if (!isOnboardingStatus(input.onboardingStatus)) {
        throw new Error('סטטוס הקמה לא תקין');
      }
      data.onboardingStatus = input.onboardingStatus;
    }

    if (Object.keys(data).length > 0) {
      await this.workspaceRepo.updateOnboarding(id, data);
    }

    if (input.ownerEmail !== undefined) {
      const owner = await this.requireUserByEmail(input.ownerEmail);
      await this.workspaceRepo.updateOwner(id, owner.id);
      const membership = await this.memberRepo.findByUserAndWorkspace(
        owner.id,
        id,
      );
      if (!membership) {
        await this.memberRepo.create({
          workspaceId: id,
          userId: owner.id,
          role: SystemRole.Owner,
        });
      } else if (
        membership.role !== SystemRole.Owner &&
        membership.role !== SystemRole.SuperAdmin
      ) {
        await this.memberRepo.updateRole(id, owner.id, SystemRole.Owner);
      }
    }

    return this.workspaceItem(id);
  }

  async deleteWorkspace(id: WorkspaceId): Promise<void> {
    const existing = await this.workspaceRepo.findById(id);
    if (!existing) throw new Error('הסביבה לא נמצאה');
    if (existing.slug === PLATFORM_WORKSPACE_SLUG) {
      throw new Error('לא ניתן למחוק את סביבת המערכת');
    }
    await this.adminRepo.deleteWorkspace(id);
  }

  async transferOwnership(
    id: WorkspaceId,
    userId: UserId,
  ): Promise<AdminWorkspaceListItem> {
    const existing = await this.workspaceRepo.findById(id);
    if (!existing) throw new Error('הסביבה לא נמצאה');
    const next = await this.userRepo.findById(userId);
    if (!next) throw new Error('המשתמש לא נמצא');
    if (existing.ownerId === userId) throw new Error('המשתמש כבר הבעלים');

    const previousId = existing.ownerId;
    await this.workspaceRepo.updateOwner(id, userId);

    const nextMembership = await this.memberRepo.findByUserAndWorkspace(userId, id);
    if (!nextMembership) {
      await this.memberRepo.create({
        workspaceId: id,
        userId,
        role: SystemRole.Owner,
      });
    } else if (nextMembership.role !== SystemRole.Owner) {
      await this.memberRepo.updateRole(id, userId, SystemRole.Owner);
    }

    if (previousId !== userId) {
      const previous = await this.memberRepo.findByUserAndWorkspace(previousId, id);
      if (
        previous &&
        (previous.role === SystemRole.Owner || previous.role === SystemRole.SuperAdmin)
      ) {
        await this.memberRepo.updateRole(id, previousId, SystemRole.Admin);
      }
    }

    return this.workspaceItem(id);
  }

  async setWorkspacePlan(
    id: WorkspaceId,
    planId: PlanId,
  ): Promise<AdminWorkspaceListItem> {
    const existing = await this.workspaceRepo.findById(id);
    if (!existing) throw new Error('הסביבה לא נמצאה');
    if (!isPlanId(planId)) throw new Error('תוכנית לא תקינה');
    await this.subscriptions.setPlan(id, planId);
    await this.modules.syncToEntitlements(id);
    return this.workspaceItem(id);
  }

  async workspaceDetail(id: WorkspaceId): Promise<AdminWorkspaceDetail> {
    const [item, members, invites] = await Promise.all([
      this.workspaceItem(id),
      this.memberRepo.listByWorkspace(id),
      this.inviteRepo.listByWorkspace(id),
    ]);
    const people = await Promise.all(
      members.map(async (member) => {
        const user = await this.userRepo.findById(member.userId);
        return {
          userId: member.userId,
          name: user?.name ?? '',
          email: user?.email ?? '',
          role: member.role,
        };
      }),
    );
    return {
      ...item,
      members: people,
      invites: invites
        .filter((invite) => invite.status === 'pending')
        .map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
        })),
    };
  }

  async updateMemberRole(
    id: WorkspaceId,
    userId: UserId,
    role: RoleName,
  ): Promise<AdminWorkspaceDetail> {
    const existing = await this.workspaceRepo.findById(id);
    if (!existing) throw new Error('הסביבה לא נמצאה');
    if (role === SystemRole.Owner) {
      throw new Error('העבירו בעלות כדי למנות בעלים');
    }
    if (!isMemberRole(role)) throw new Error('תפקיד לא תקין');
    if (existing.ownerId === userId) {
      throw new Error('לא ניתן לשנות את תפקיד הבעלים כאן');
    }
    const membership = await this.memberRepo.findByUserAndWorkspace(userId, id);
    if (!membership) throw new Error('החבר לא נמצא');
    await this.memberRepo.updateRole(id, userId, role);
    return this.workspaceDetail(id);
  }

  async bulkWorkspaces(input: {
    action: 'delete' | 'set_status';
    ids: string[];
    status?: WorkspaceStatus;
  }): Promise<AdminBulkResult> {
    return this.runBulk(input.ids, async (id) => {
      if (input.action === 'delete') {
        await this.deleteWorkspace(id as WorkspaceId);
        return;
      }
      if (!isWorkspaceStatus(input.status)) {
        throw new Error('סטטוס לא תקין');
      }
      await this.updateWorkspace(id as WorkspaceId, { status: input.status });
    });
  }

  async beginImpersonation(actor: User, workspaceId: WorkspaceId): Promise<Workspace> {
    if (actor.platformRole !== SystemRole.SuperAdmin) {
      throw new Error('נדרשת הרשאת סופר־אדמין');
    }
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new Error('הסביבה לא נמצאה');
    if (workspace.status === 'deactivated') {
      throw new Error('הסביבה מושבתת. הפעילו אותה לפני כניסה.');
    }
    await this.userRepo.setImpersonatingWorkspace(actor.id, workspace.id);
    return workspace;
  }

  async stopImpersonation(actor: User) {
    await this.userRepo.setImpersonatingWorkspace(actor.id, null);
    const resolved = await this.workspaceService.getCurrentForUser(actor.id);
    if (!resolved) throw new Error('לא נמצאה סביבה לחזרה');
    return resolved;
  }

  async listUsers(): Promise<{ users: AdminUserListItem[] }> {
    const rows = await this.userRepo.listForAdmin();
    return {
      users: rows.map(({ user, membershipCount, ownedWorkspaceCount }) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole ?? null,
        emailVerified: Boolean(user.emailVerifiedAt),
        createdAt:
          user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : String(user.createdAt),
        membershipCount,
        ownedWorkspaceCount,
      })),
    };
  }

  async createUser(input: AdminCreateUserInput): Promise<AdminUserListItem> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    if (!email || !name || !input.password) {
      throw new Error('שם, אימייל וסיסמה הם שדות חובה');
    }
    if (!email.includes('@')) throw new Error('אימייל לא תקין');
    if (input.password.length < 8) {
      throw new Error('סיסמה חייבת להכיל לפחות 8 תווים');
    }
    if (isPlatformSuperAdminEmail(email)) {
      throw new Error('לא ניתן ליצור את חשבון המערכת מחדש');
    }
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error('משתמש עם אימייל זה כבר קיים');

    const user = await this.userRepo.create({
      email,
      name,
      passwordHash: await bcrypt.hash(input.password, 12),
      emailVerifiedAt: new Date(),
      platformRole:
        input.platformRole === SystemRole.SuperAdmin ? SystemRole.SuperAdmin : null,
    });
    return this.userItem(user.id);
  }

  async updateUser(
    id: UserId,
    input: AdminUpdateUserInput,
  ): Promise<AdminUserListItem> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new Error('המשתמש לא נמצא');

    const system = isPlatformSuperAdminEmail(existing.email);
    if (system && input.password) {
      throw new Error('סיסמת חשבון המערכת מתעדכנת לפי התאריך');
    }
    if (system && input.platformRole === null) {
      throw new Error('לא ניתן להסיר הרשאת סופר־אדמין מחשבון המערכת');
    }
    if (
      system &&
      input.email &&
      input.email.trim().toLowerCase() !== existing.email
    ) {
      throw new Error('לא ניתן לשנות את אימייל חשבון המערכת');
    }

    const data: {
      email?: string;
      name?: string;
      passwordHash?: string;
      platformRole?: string | null;
      emailVerifiedAt?: Date | null;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error('חסר שם');
      data.name = name;
    }
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email.includes('@')) throw new Error('אימייל לא תקין');
      data.email = email;
    }
    if (input.password) {
      if (input.password.length < 8) {
        throw new Error('סיסמה חייבת להכיל לפחות 8 תווים');
      }
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }
    if (input.platformRole !== undefined && !system) {
      data.platformRole =
        input.platformRole === SystemRole.SuperAdmin ? SystemRole.SuperAdmin : null;
    }
    if (input.emailVerified !== undefined) {
      data.emailVerifiedAt = input.emailVerified ? (existing.emailVerifiedAt ?? new Date()) : null;
    }

    try {
      await this.userRepo.update(id, data);
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error('אימייל זה כבר בשימוש');
      throw error;
    }

    return this.userItem(id);
  }

  async deleteUser(actorId: UserId, id: UserId): Promise<void> {
    if (actorId === id) throw new Error('לא ניתן למחוק את המשתמש המחובר');
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new Error('המשתמש לא נמצא');
    if (isPlatformSuperAdminEmail(existing.email)) {
      throw new Error('לא ניתן למחוק את חשבון המערכת');
    }
    const owned = await this.adminRepo.countOwnedWorkspaces(id);
    if (owned > 0) {
      throw new Error(
        'המשתמש בעלים של סביבות. העבירו בעלות או מחקו אותן קודם.',
      );
    }
    await this.adminRepo.deleteUser(id, actorId);
  }

  async bulkDeleteUsers(actorId: UserId, ids: string[]): Promise<AdminBulkResult> {
    return this.runBulk(ids, (id) => this.deleteUser(actorId, id as UserId));
  }

  private async runBulk(
    ids: string[],
    work: (id: string) => Promise<void>,
  ): Promise<AdminBulkResult> {
    const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(
      0,
      100,
    );
    if (unique.length === 0) throw new Error('לא נבחרו פריטים');

    const succeeded: string[] = [];
    const failed: AdminBulkResult['failed'] = [];
    for (const id of unique) {
      try {
        await work(id);
        succeeded.push(id);
      } catch (error) {
        failed.push({
          id,
          message: error instanceof Error ? error.message : 'הפעולה נכשלה',
        });
      }
    }
    return { succeeded, failed };
  }

  private async workspaceItem(id: WorkspaceId): Promise<AdminWorkspaceListItem> {
    const workspace = await this.workspaceRepo.findById(id);
    if (!workspace) throw new Error('הסביבה לא נמצאה');
    const [owner, members] = await Promise.all([
      this.userRepo.findById(workspace.ownerId),
      this.memberRepo.listByWorkspace(id),
    ]);
    return {
      workspace,
      owner: {
        id: workspace.ownerId,
        email: owner?.email ?? '',
        name: owner?.name ?? '',
      },
      memberCount: members.length,
      protected: workspace.slug === PLATFORM_WORKSPACE_SLUG,
      planId: await this.planIdFor(id),
    };
  }

  private async planIdFor(id: WorkspaceId): Promise<PlanId> {
    const subscription = await this.subscriptions.getByWorkspace(id);
    return isPlanId(subscription?.planId) ? subscription.planId : 'free';
  }

  private async userItem(id: UserId): Promise<AdminUserListItem> {
    const listed = await this.listUsers();
    const item = listed.users.find((user) => user.id === id);
    if (!item) throw new Error('המשתמש לא נמצא');
    return item;
  }

  private async requireUserByEmail(email: string): Promise<User> {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) throw new Error('אימייל בעלים לא תקין');
    const user = await this.userRepo.findByEmail(normalized);
    if (!user) throw new Error('בעלים לא נמצא. צרו את המשתמש קודם.');
    return user;
  }

  private async uniqueSlug(raw: string): Promise<string> {
    let slug = normalizeSlug(raw);
    if (!isValidSlug(slug)) {
      slug = `ws-${crypto.randomUUID().slice(0, 10)}`;
    }
    const taken = await this.workspaceRepo.findBySlug(slug);
    if (taken) {
      slug = `ws-${crypto.randomUUID().slice(0, 10)}`;
    }
    return slug;
  }
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2;
}

function isWorkspaceStatus(value: string | undefined): value is WorkspaceStatus {
  return Boolean(value && WORKSPACE_STATUSES.includes(value as WorkspaceStatus));
}

function isOnboardingStatus(
  value: string | undefined,
): value is OnboardingStatus {
  return Boolean(
    value &&
      (ONBOARDING_STATUSES as readonly string[]).includes(value),
  );
}

const PLAN_IDS: PlanId[] = ['free', 'starter', 'growth', 'enterprise'];

function isPlanId(value: string | null | undefined): value is PlanId {
  return Boolean(value && PLAN_IDS.includes(value as PlanId));
}

function isMemberRole(value: string): value is RoleName {
  return (
    value === SystemRole.SuperAdmin ||
    value === SystemRole.Owner ||
    value === SystemRole.Admin ||
    value === SystemRole.Member ||
    value === SystemRole.Viewer
  );
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export interface AdminBulkResult {
  succeeded: string[];
  failed: Array<{ id: string; message: string }>;
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002',
  );
}
