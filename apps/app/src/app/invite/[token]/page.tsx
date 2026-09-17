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
  const invitePath = `/invite/${encodeURIComponent(token)}`;
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
        `${ROUTES.loginEmail}?next=${encodeURIComponent(invitePath)}`,
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

  const status = invite?.status;
  const isPending = status === 'pending';
  const isExpired = status === 'expired';
  const isAccepted = status === 'accepted';
  const isInvalid = Boolean(error) && !invite;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>הזמנה לסביבת עבודה</CardTitle>
          <CardDescription>
            {isInvalid
              ? 'ההזמנה אינה תקפה או שפגה תוקפה.'
              : invite
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
              {isExpired ? (
                <p className="text-sm text-muted-foreground">
                  תוקף ההזמנה פג. בקשו הזמנה חדשה מבעל הסביבה.
                </p>
              ) : null}
              {isAccepted ? (
                <p className="text-sm text-muted-foreground">
                  ההזמנה כבר התקבלה.
                </p>
              ) : null}
              {isPending ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={busy || isLoading}
                    onClick={() => void accept()}
                  >
                    {isAuthenticated ? 'קבלת הזמנה' : 'התחברות לקבלה'}
                  </Button>
                  {!isAuthenticated ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link
                        href={`${ROUTES.register}?next=${encodeURIComponent(invitePath)}`}
                      >
                        יצירת חשבון לקבלה
                      </Link>
                    </Button>
                  ) : null}
                </div>
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
