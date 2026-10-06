'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { requiresOnboarding } from '@kodem/contracts';
import { useAuth } from '../../providers/auth-provider';
import { isApiError } from '../../lib/api';
import { fetchEntryResolution } from '../../lib/entry/entry-flow';
import { clearToken, getToken } from '../../lib/auth/storage';
import { ROUTES } from '../../lib/constants';

export function EntryResolver() {
  const router = useRouter();
  const { isAuthenticated, isLoading, workspace } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const workspaceRef = useRef(workspace);
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Stale local token without a session used to leave this screen hanging.
      if (getToken()) clearToken();
      router.replace(ROUTES.login);
      return;
    }

    let ignore = false;
    const currentWorkspace = workspaceRef;

    async function resolve() {
      try {
        const resolution = await fetchEntryResolution();
        if (ignore) return;

        if (resolution.error) {
          setError(resolution.error.message);
          return;
        }

        let route = resolution.route;
        // Safety net: never land on dashboard while active workspace needs setup.
        const activeWorkspace = currentWorkspace.current;
        if (
          activeWorkspace &&
          requiresOnboarding(activeWorkspace) &&
          route === ROUTES.dashboard
        ) {
          route = ROUTES.setup;
        }

        if (ignore) return;
        router.replace(route);
      } catch (err) {
        if (ignore) return;
        setError(
          isApiError(err)
            ? err.message
            : 'לא ניתן להמשיך. נסו שוב.',
        );
      }
    }

    void resolve();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isLoading, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>לא ניתן להמשיך</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.login}>חזרה לכניסה</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">מכינים את הסביבה שלכם…</p>
    </div>
  );
}
