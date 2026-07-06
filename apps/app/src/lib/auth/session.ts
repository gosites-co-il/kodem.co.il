import { ROUTES } from '../constants';
import { setToken } from './storage';

export interface AuthSession {
  user: import('@kodem/contracts').User;
  workspace: import('@kodem/contracts').Workspace;
  role: import('@kodem/contracts').RoleName;
}

export async function persistAuthResult(result: {
  token: string;
  user: AuthSession['user'];
  workspace: AuthSession['workspace'];
  role: AuthSession['role'];
}): Promise<AuthSession> {
  setToken(result.token);
  return {
    user: result.user,
    workspace: result.workspace,
    role: result.role,
  };
}

/** @deprecated Use completeAuthFlow from lib/entry/entry-flow */
export async function resolvePostAuthRoute(): Promise<string> {
  return ROUTES.entry;
}

export { completeAuthFlow } from '../entry/entry-flow';
