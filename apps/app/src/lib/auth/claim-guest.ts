import type { AuthResult } from '@kodem/contracts';
import { api } from '../api';
import {
  clearGuestClaim,
  readGuestClaim,
} from './guest-claim';

/**
 * After register/login, claim a pending guest workspace if credentials exist.
 * On failure, clears claim and returns null so the caller keeps the new session.
 */
export async function claimGuestWorkspaceIfPending(): Promise<AuthResult | null> {
  const claim = readGuestClaim();
  if (!claim) return null;

  try {
    const result = await api.claimGuestSetup(claim);
    clearGuestClaim();
    return result;
  } catch {
    clearGuestClaim();
    return null;
  }
}
