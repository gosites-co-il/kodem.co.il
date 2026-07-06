'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { ROUTES } from '../../lib/constants';
import { guardRouteForWorkspace } from '../../lib/entry/routes';

export function EntryGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, workspace } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }

    const redirect = guardRouteForWorkspace(pathname, workspace);
    if (redirect) {
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, pathname, router, workspace]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">טוען…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">מעביר לכניסה…</p>
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
