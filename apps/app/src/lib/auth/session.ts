import type { RoleName, User, Workspace } from '@kodem/contracts';
import { ROUTES } from '../constants';
import { api } from '../api';
import { setToken } from './storage';

export interface AuthSession {
  user: User;
  workspace: Workspace;
  role: RoleName;
}

export async function persistAuthResult(result: {
  token: string;
  user: User;
  workspace: Workspace;
  role: RoleName;
}): Promise<AuthSession> {
  setToken(result.token);
  return {
    user: result.user,
    workspace: result.workspace,
    role: result.role,
  };
}

export async function resolvePostAuthRoute(): Promise<string> {
  const { workspaces } = await api.listWorkspaces();

  if (workspaces.length === 0) {
    return `${ROUTES.login}?error=no_workspace`;
  }

  if (workspaces.length === 1) {
    return ROUTES.dashboard;
  }

  return ROUTES.workspaceSelect;
}

export async function completeAuthFlow(result: {
  token: string;
  user: User;
  workspace: Workspace;
  role: RoleName;
}): Promise<string> {
  await persistAuthResult(result);
  return resolvePostAuthRoute();
}
