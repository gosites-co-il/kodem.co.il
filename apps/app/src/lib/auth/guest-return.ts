import { resolveMarketingReturnUrl } from '../marketing-origin';

const GUEST_RETURN_STORAGE_KEY = 'kodem_guest_return_to';

/** Persist where the guest came from (marketing page) across query clear. */
export function storeGuestReturnTo(url: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GUEST_RETURN_STORAGE_KEY, url);
}

export function readGuestReturnTo(): string {
  if (typeof window === 'undefined') {
    return resolveMarketingReturnUrl(null);
  }
  const stored = sessionStorage.getItem(GUEST_RETURN_STORAGE_KEY);
  return resolveMarketingReturnUrl(stored);
}

export function clearGuestReturnTo(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(GUEST_RETURN_STORAGE_KEY);
}
