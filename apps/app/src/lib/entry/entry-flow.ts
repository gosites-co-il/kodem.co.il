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

/** Persist auth and navigate to the entry resolver. */
export async function completeAuthFlow(result: {
  token: string;
  user: import('@kodem/contracts').User;
  workspace: import('@kodem/contracts').Workspace;
  role: import('@kodem/contracts').RoleName;
}): Promise<string> {
  setToken(result.token);
  return ENTRY_ROUTES.entry;
}
