'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { ROUTES } from '../../lib/constants';
import { guardRouteForWorkspace } from '../../lib/entry/routes';

/**
 * Enforces login + setup ↔ dashboard for the active workspace.
 * Middleware is the first line; this gate covers expired/missing client sessions.
 * Guest marketing bootstrap (`/setup/*?websiteUrl=`) is allowed through so
 * SetupJourney can create the ephemeral session.
 */
export function EntryGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isGuestBootstrap =
    pathname.startsWith(ROUTES.setup) &&
    Boolean(searchParams.get('websiteUrl')?.trim());

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (isGuestBootstrap) return;
      const loginUrl = new URL(ROUTES.login, window.location.origin);
      const next =
        searchParams.toString().length > 0
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
      loginUrl.searchParams.set('next', next);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    const redirect = guardRouteForWorkspace(pathname, workspace);
    if (redirect) {
      router.replace(redirect);
    }
  }, [
    isLoading,
    isAuthenticated,
    isGuestBootstrap,
    pathname,
    router,
    workspace,
    searchParams,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">טוען…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isGuestBootstrap) {
      return <>{children}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">טוען…</p>
      </div>
    );
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
