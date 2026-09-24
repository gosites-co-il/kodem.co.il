'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { ROUTES } from '../../lib/constants';
import { guardRouteForWorkspace } from '../../lib/entry/routes';

function EntryGateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">טוען…</p>
    </div>
  );
}

function currentPathWithSearch(pathname: string): string {
  if (typeof window === 'undefined') return pathname;
  const search = window.location.search.replace(/^\?/, '');
  return search ? `${pathname}?${search}` : pathname;
}

function hasGuestWebsiteUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    new URLSearchParams(window.location.search).get('websiteUrl')?.trim(),
  );
}

/**
 * Enforces login + setup ↔ dashboard for the active workspace.
 * Middleware is the first line; this gate covers expired/missing client sessions.
 * Guest marketing bootstrap (`/setup/*?websiteUrl=`) is allowed through so
 * SetupJourney can create the ephemeral session.
 *
 * Avoids useSearchParams so navigations are not wrapped in a Suspense boundary
 * that remounts the whole tree (page flicker).
 */
export function EntryGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const onSetup = pathname.startsWith(ROUTES.setup);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (onSetup && hasGuestWebsiteUrl()) return;
      const loginUrl = new URL(ROUTES.login, window.location.origin);
      loginUrl.searchParams.set('next', currentPathWithSearch(pathname));
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    const redirect = guardRouteForWorkspace(pathname, workspace);
    if (redirect) {
      router.replace(redirect);
    }
  }, [isLoading, isAuthenticated, onSetup, pathname, router, workspace]);

  if (isLoading) {
    return <EntryGateFallback />;
  }

  if (!isAuthenticated) {
    // Setup routes may be guest bootstrap; effect redirects if not.
    if (onSetup) {
      return <>{children}</>;
    }
    return <EntryGateFallback />;
  }

  const redirect = guardRouteForWorkspace(pathname, workspace);
  if (redirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">מעביר…</p>
      </div>
    );
  }

  return <>{children}</>;
}
