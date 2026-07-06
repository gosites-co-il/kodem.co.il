import type { RoleName } from './role';
import type { Member } from './member';
import type { User } from './user';
import type { Workspace } from './workspace';
import { ENTRY_ROUTES } from './entry-routes';

/** Workspace onboarding lifecycle — extensible without hardcoding transitions. */
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const ONBOARDING_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
] as const satisfies readonly OnboardingStatus[];

export type OnboardingStepId =
  | 'business_name'
  | 'website'
  | 'industry'
  | 'business_size'
  | 'finish';

export const ONBOARDING_STEPS: readonly OnboardingStepId[] = [
  'business_name',
  'website',
  'industry',
  'business_size',
  'finish',
] as const;

export interface OnboardingData {
  name?: string;
  websiteUrl?: string;
  industry?: string;
  businessSize?: string;
}

export interface UpdateOnboardingInput {
  step: OnboardingStepId;
  data: OnboardingData;
}

/** Entry flow phases — the platform gateway state machine. */
export type EntryPhase =
  | 'unauthenticated'
  | 'workspace_select'
  | 'onboarding'
  | 'dashboard'
  | 'error';

export interface WorkspaceMembershipContext {
  workspace: Workspace;
  role: RoleName;
  membership: Member;
}

export interface EntryContext {
  isAuthenticated: boolean;
  user?: User;
  activeWorkspace?: Workspace;
  memberships: WorkspaceMembershipContext[];
  /** Set after explicit workspace selection in multi-tenant flow. */
  workspaceSelected?: boolean;
}

export interface EntryResolution {
  phase: EntryPhase;
  route: string;
  workspace?: Workspace;
  onboardingStep?: number;
  error?: { code: string; message: string };
}

export function requiresOnboarding(workspace: Workspace): boolean {
  return workspace.onboardingStatus !== 'COMPLETED';
}

export function resolveWorkspaceRoute(workspace: Workspace): string {
  if (workspace.onboardingStatus === 'COMPLETED') {
    return ENTRY_ROUTES.dashboard;
  }
  return ENTRY_ROUTES.setup;
}
