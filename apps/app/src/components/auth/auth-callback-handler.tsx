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
import { claimGuestWorkspaceIfPending } from '../../lib/auth/claim-guest';
import { api } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import {
  clearPendingSignupConsent,
  readPendingSignupConsent,
} from './signup-legal-consent';

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = searchParams.get('token');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('ההתחברות נכשלה. נסו שוב.');
      return;
    }

    async function handleCallback() {
      try {
        if (token) {
          setToken(token);
        } else {
          const refreshed = await api.refresh();
          if (cancelled) return;
          if (!refreshed) {
            setError('חסר אסימון אימות.');
            return;
          }
        }

        const pending = readPendingSignupConsent();
        if (pending) {
          try {
            await api.acceptLegalConsent({
              consents: pending.consents,
              source: pending.source,
              authMethod: 'unknown',
            });
          } catch {
            // Status gate will require consent if recording failed.
          } finally {
            clearPendingSignupConsent();
          }
        }

        const claimed = await claimGuestWorkspaceIfPending();
        if (cancelled) return;

        if (claimed) {
          setSession({
            user: claimed.user,
            workspace: claimed.workspace,
            role: claimed.role,
            token: claimed.accessToken ?? claimed.token,
          });
          router.replace(`${ROUTES.setup}/connections`);
          return;
        }

        const me = await api.me();
        if (cancelled) return;
        setSession({
          user: me.user,
          workspace: me.workspace,
          role: me.role,
        });
        router.replace(ROUTES.entry);
      } catch {
        if (!cancelled) {
          setError('לא ניתן להשלים את ההתחברות. נסו שוב.');
        }
      }
    }

    void handleCallback();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setSession]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>ההתחברות נכשלה</CardTitle>
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
      <p className="text-sm text-muted-foreground">משלימים התחברות…</p>
    </div>
  );
}
