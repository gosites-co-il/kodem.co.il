'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { ROUTES } from '../../lib/constants';
import { guardRouteForWorkspace } from '../../lib/entry/routes';

/**
 * Enforces login + setup ↔ dashboard for the active workspace.
 * Middleware is the first line; this gate covers expired/missing client sessions.
 */
export function EntryGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const loginUrl = new URL(ROUTES.login, window.location.origin);
      loginUrl.searchParams.set('next', pathname);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      return;
    }

    const redirect = guardRouteForWorkspace(pathname, workspace);
    if (redirect) {
      router.replace(redirect);
    }
  }, [isLoading, isAuthenticated, pathname, router, workspace]);

  if (isLoading || !isAuthenticated) {
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
