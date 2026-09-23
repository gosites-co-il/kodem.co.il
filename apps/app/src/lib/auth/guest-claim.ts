import { GUEST_CLAIM_COOKIE } from '../constants';

const GUEST_CLAIM_STORAGE_KEY = 'kodem_guest_claim';

export type GuestClaimCredentials = {
  workspaceId: string;
  claimSecret: string;
};

export function storeGuestClaim(credentials: GuestClaimCredentials): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify(credentials);
  sessionStorage.setItem(GUEST_CLAIM_STORAGE_KEY, payload);
  document.cookie = `${GUEST_CLAIM_COOKIE}=${encodeURIComponent(payload)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function readGuestClaim(): GuestClaimCredentials | null {
  if (typeof window === 'undefined') return null;

  const fromStorage = sessionStorage.getItem(GUEST_CLAIM_STORAGE_KEY);
  if (fromStorage) {
    const parsed = parseClaim(fromStorage);
    if (parsed) return parsed;
  }

  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_CLAIM_COOKIE}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.slice(GUEST_CLAIM_COOKIE.length + 1));
  return parseClaim(raw);
}

export function clearGuestClaim(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_CLAIM_STORAGE_KEY);
  document.cookie = `${GUEST_CLAIM_COOKIE}=; path=/; max-age=0`;
}

function parseClaim(raw: string): GuestClaimCredentials | null {
  try {
    const parsed = JSON.parse(raw) as GuestClaimCredentials;
    if (
      typeof parsed?.workspaceId === 'string' &&
      parsed.workspaceId &&
      typeof parsed?.claimSecret === 'string' &&
      parsed.claimSecret
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}
