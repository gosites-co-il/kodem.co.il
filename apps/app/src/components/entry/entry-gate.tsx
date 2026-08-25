'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { guardRouteForWorkspace } from '../../lib/entry/routes';

/**
 * Enforces setup ↔ dashboard for the active workspace.
 * Authentication is handled by middleware; this gate only applies workspace routing.
 */
export function EntryGate({ children }: { children: React.ReactNode }) {
  const { isLoading, workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const redirect = guardRouteForWorkspace(pathname, workspace);
    if (redirect) {
      router.replace(redirect);
    }
  }, [isLoading, pathname, router, workspace]);

  if (isLoading) {
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
