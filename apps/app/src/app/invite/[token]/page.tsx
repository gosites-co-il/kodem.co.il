'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { InvitePublicView } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError } from '../../../lib/api';
import { ROUTES } from '../../../lib/constants';
import { useAuth } from '../../../providers/auth-provider';

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token ?? '');
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const [invite, setInvite] = useState<InvitePublicView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void api
      .getInvite(token)
      .then(setInvite)
      .catch((err) =>
        setError(isApiError(err) ? err.message : 'ההזמנה לא נמצאה'),
      );
  }, [token]);

  async function accept() {
    if (!isAuthenticated) {
      router.push(
        `${ROUTES.login}?next=${encodeURIComponent(`/invite/${encodeURIComponent(token)}`)}`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.acceptInvite(token);
      await refreshSession();
      router.replace(ROUTES.entry);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לקבל את ההזמנה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>הזמנה לסביבת עבודה</CardTitle>
          <CardDescription>
            {invite
              ? `הוזמנתם ל־${invite.workspaceName} בתפקיד ${invite.role}`
              : 'טוענים פרטי הזמנה…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {invite ? (
            <>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {invite.email}
              </p>
              <p className="text-xs text-muted-foreground">
                סטטוס: {invite.status}
              </p>
              {invite.status === 'pending' ? (
                <Button
                  className="w-full"
                  disabled={busy || isLoading}
                  onClick={() => void accept()}
                >
                  {isAuthenticated ? 'קבלת הזמנה' : 'התחברות לקבלה'}
                </Button>
              ) : null}
            </>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link href={ROUTES.login}>חזרה לכניסה</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
