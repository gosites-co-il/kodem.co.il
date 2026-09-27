import type { OnboardingStatus } from './onboarding';
import type { UserId } from './ids';
import type { PlatformRole } from './user';
import type { Workspace, WorkspaceStatus } from './workspace';

/** Slug of the operator home workspace. It cannot be deleted from the admin UI. */
export const PLATFORM_WORKSPACE_SLUG = 'kodem-platform';

export interface AdminWorkspaceListItem {
  workspace: Workspace;
  owner: { id: UserId; email: string; name: string };
  memberCount: number;
  protected: boolean;
}

export interface AdminUserListItem {
  id: UserId;
  email: string;
  name: string;
  platformRole: PlatformRole | null;
  emailVerified: boolean;
  createdAt: string;
  membershipCount: number;
  ownedWorkspaceCount: number;
}

export interface AdminUpsertWorkspaceInput {
  name?: string;
  slug?: string;
  websiteUrl?: string | null;
  industry?: string | null;
  businessSize?: string | null;
  status?: WorkspaceStatus;
  onboardingStatus?: OnboardingStatus;
  ownerEmail?: string;
}

export interface AdminCreateUserInput {
  email: string;
  name: string;
  password: string;
  platformRole?: PlatformRole | null;
}

export interface AdminUpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  platformRole?: PlatformRole | null;
  emailVerified?: boolean;
}
