import { RoleName } from './role';
import { User } from './user';
import { Workspace } from './workspace';
import { Member } from './member';
import { UserId, WorkspaceId } from './ids';

export interface JwtPayload {
  sub: UserId;
  email: string;
  workspaceId: WorkspaceId;
  role: RoleName;
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
  token: string;
  user: User;
  workspace: Workspace;
  role: RoleName;
}
