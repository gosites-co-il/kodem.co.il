import * as bcrypt from 'bcryptjs';
import { PLATFORM_WORKSPACE_SLUG } from '@kodem/contracts';
import {
  MemberRepository,
  UserRepository,
  WorkspaceRepository,
} from '@kodem/database';
import {
  dailySuperAdminPassword,
  PLATFORM_SUPER_ADMIN_EMAIL,
} from '@kodem/platform/auth';
import { getRequiredSignupConsents } from '@kodem/platform/legal';
import { LegalConsentService } from '@kodem/platform/legal/consent';
import { SubscriptionService } from '@kodem/platform/subscription';
import { WorkspaceModuleService } from '@kodem/platform/workspace';

/** Creates or refreshes the operator account and a completed home workspace. */
export async function ensurePlatformSuperAdmin(): Promise<void> {
  const userRepo = new UserRepository();
  const memberRepo = new MemberRepository();
  const workspaceRepo = new WorkspaceRepository();
  const passwordHash = await bcrypt.hash(dailySuperAdminPassword(), 12);

  let user = await userRepo.findByEmail(PLATFORM_SUPER_ADMIN_EMAIL);
  if (!user) {
    user = await userRepo.create({
      email: PLATFORM_SUPER_ADMIN_EMAIL,
      name: 'Kodem',
      passwordHash,
      emailVerifiedAt: new Date(),
      platformRole: 'super_admin',
    });
  } else {
    user = await userRepo.update(user.id, {
      platformRole: 'super_admin',
      passwordHash,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    });
  }

  const memberships = await memberRepo.findByUserId(user.id);
  if (memberships.length === 0) {
    let slug = PLATFORM_WORKSPACE_SLUG;
    if (await workspaceRepo.findBySlug(slug)) {
      slug = `${PLATFORM_WORKSPACE_SLUG}-${crypto.randomUUID().slice(0, 6)}`;
    }
    const created = await workspaceRepo.createForUser({
      name: 'Kodem',
      slug,
      ownerId: user.id,
    });
    await workspaceRepo.updateOnboarding(created.workspace.id, {
      onboardingStatus: 'COMPLETED',
      status: 'active',
    });
    await memberRepo.updateRole(created.workspace.id, user.id, 'super_admin');
    await new SubscriptionService().ensureForWorkspace(created.workspace.id);
    await new WorkspaceModuleService().enableDefaultFreeModules(
      created.workspace.id,
    );
  }

  const legal = new LegalConsentService();
  const status = await legal.getStatus(user);
  if (status.pending.some((item) => item.reason === 'signup')) {
    await legal.recordSignupConsents({
      userId: user.id,
      consents: getRequiredSignupConsents(),
      source: 'SIGNUP',
      locale: 'he-IL',
      authMethod: 'password',
    });
  }
}
