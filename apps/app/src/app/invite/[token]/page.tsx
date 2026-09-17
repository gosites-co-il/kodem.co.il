'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { InvitePublicView } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { api, isApiError } from '../../../lib/api';
import { ROUTES } from '../../../lib/constants';
import { useAuth } from '../../../providers/auth-provider';
import { AuthShell, authFieldClasses } from '../../../components/auth/auth-shell';

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
        `${ROUTES.login}?next=${encodeURIComponent(invitePath)}`,
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

  const description = isInvalid
    ? 'ההזמנה אינה תקפה או שפגה תוקפה'
    : invite
      ? `הוזמנתם ל־${invite.workspaceName} בתפקיד ${invite.role}`
      : 'טוענים פרטי הזמנה…';

  return (
    <AuthShell
      title="הזמנה לסביבת עבודה"
      description={description}
      showLegal={false}
      footer={
        <Link
          href={ROUTES.login}
          className="underline underline-offset-4 hover:text-foreground"
        >
          חזרה לכניסה
        </Link>
      }
    >
      <div className="grid gap-4">
        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : null}

        {invite ? (
          <>
            <p
              className="rounded-full bg-muted px-5 py-3 text-center text-sm text-muted-foreground"
              dir="ltr"
            >
              {invite.email}
            </p>

            {isExpired ? (
              <p className="text-center text-sm text-muted-foreground">
                תוקף ההזמנה פג. בקשו הזמנה חדשה מבעל הסביבה.
              </p>
            ) : null}

            {isAccepted ? (
              <p className="text-center text-sm text-muted-foreground">
                ההזמנה כבר התקבלה.
              </p>
            ) : null}

            {isPending ? (
              <div className="grid gap-3">
                <Button
                  className={authFieldClasses.button}
                  disabled={busy || isLoading}
                  onClick={() => void accept()}
                >
                  {isAuthenticated ? 'קבלת הזמנה' : 'התחברות לקבלה'}
                </Button>
                {!isAuthenticated ? (
                  <Button
                    asChild
                    variant="outline"
                    className={authFieldClasses.buttonOutline}
                  >
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
      </div>
    </AuthShell>
  );
}
