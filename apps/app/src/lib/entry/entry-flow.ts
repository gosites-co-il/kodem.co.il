import { ENTRY_ROUTES, type EntryResolution } from '@kodem/contracts';
import { api } from '../api';
import { setToken } from '../auth/storage';

export type { EntryResolution };

/** Fetch server-side entry resolution (authoritative). */
export async function fetchEntryResolution(options?: {
  workspaceSelected?: boolean;
}): Promise<EntryResolution> {
  return api.resolveEntry(options?.workspaceSelected);
}

/** Persist auth and navigate to entry — or honor a safe `next` redirect. */
export async function completeAuthFlow(
  result: {
    token: string;
    user: import('@kodem/contracts').User;
    workspace: import('@kodem/contracts').Workspace;
    role: import('@kodem/contracts').RoleName;
  },
  options?: { next?: string | null },
): Promise<string> {
  setToken(result.token);
  const next = options?.next?.trim();
  if (next && isSafeNextPath(next)) {
    return next;
  }
  return ENTRY_ROUTES.entry;
}

function isSafeNextPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}
