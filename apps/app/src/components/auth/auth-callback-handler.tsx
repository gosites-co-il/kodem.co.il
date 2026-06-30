'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { setToken } from '../../lib/auth/storage';
import { api } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('Authentication failed. Please try again.');
      return;
    }

    if (!token) {
      setError('Missing authentication token.');
      return;
    }

    async function handleCallback() {
      try {
        setToken(token!);
        const me = await api.me();
        setSession({
          user: me.user,
          workspace: me.workspace,
          role: me.role,
        });

        const { workspaces } = await api.listWorkspaces();
        if (workspaces.length === 0) {
          setError('No workspace found for this account.');
          return;
        }

        if (workspaces.length === 1) {
          router.replace(ROUTES.dashboard);
          return;
        }

        router.replace(ROUTES.workspaceSelect);
      } catch {
        setError('Unable to complete sign in. Please try again.');
      }
    }

    void handleCallback();
  }, [router, searchParams, setSession]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.login}>Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
