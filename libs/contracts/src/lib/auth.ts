import { RoleName } from './role';
import { User } from './user';
import { Workspace } from './workspace';
import { Member } from './member';
import { UserId, WorkspaceId } from './ids';

export type AuthTokenType =
  | 'password_reset'
  | 'email_verification'
  | 'refresh';

export interface JwtPayload {
  sub: UserId;
  email: string;
  workspaceId: WorkspaceId;
  role: RoleName;
  typ?: 'access';
  iat?: number;
  exp?: number;
}

export interface PlatformContext {
  user: User;
  workspace: Workspace;
  role: RoleName;
  membership: Member;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  /** Short-lived access token (never put in URLs). */
  accessToken: string;
  /** @deprecated Prefer accessToken — kept for gradual client migration. */
  token: string;
  user: User;
  workspace: Workspace;
  role: RoleName;
  emailVerified: boolean;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  password: string;
}

export interface EmailVerifyInput {
  token: string;
}

export interface RefreshResult {
  accessToken: string;
  token: string;
  user: User;
  workspace: Workspace;
  role: RoleName;
}
