'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import type { InvitePublicView, RoleName } from '@kodem/contracts';
import {
  Avatar,
  AvatarFallback,
} from '@kodem/design-system/components/ui/avatar';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  AuthShell,
  authFieldClasses,
} from '../../../components/auth/auth-shell';
import { api, isApiError } from '../../../lib/api';
import { ROUTES } from '../../../lib/constants';
import { useAuth } from '../../../providers/auth-provider';

const ROLE_LABELS: Record<RoleName, string> = {
  owner: 'בעלים',
  admin: 'מנהל',
  member: 'חבר צוות',
  viewer: 'צופה',
};

function formatExpiry(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initialsFrom(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0] ?? '?').slice(0, 2).toUpperCase();
}

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
      router.push(`${ROUTES.login}?next=${encodeURIComponent(invitePath)}`);
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

  const inviterName = invite?.invitedByName?.trim() || 'חבר צוות';
  const memberCount = invite?.memberCount ?? invite?.membersPreview?.length ?? 0;
  const roleLabel = invite ? ROLE_LABELS[invite.role] : '';
  const expiryLabel = invite ? formatExpiry(invite.expiresAt) : '';

  const title = isInvalid
    ? 'ההזמנה אינה תקפה'
    : invite
      ? `הזמנה ל־${invite.workspaceName}`
      : 'טוענים הזמנה…';

  const description = isExpired
    ? 'תוקף ההזמנה פג. בקשו הזמנה חדשה מבעל הסביבה.'
    : isAccepted
      ? 'ההזמנה כבר התקבלה. אפשר להמשיך לסביבת העבודה.'
      : invite
        ? `${inviterName} הזמין/ה אתכם להצטרף כ־${roleLabel}`
        : 'רגע אחד…';

  return (
    <AuthShell
      title={title}
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
        {invite && !isInvalid ? (
          <>
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <BadgeCheck className="size-3.5 text-primary" aria-hidden />
              הזמנה מאומתת
              {expiryLabel ? ` · עד ${expiryLabel}` : null}
            </div>

            {invite.membersPreview && invite.membersPreview.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center">
                  {invite.membersPreview.map((member, index) => (
                    <Avatar
                      key={`${member.initials}-${index}`}
                      className="size-9 border-2 border-background"
                      style={{ marginInlineStart: index === 0 ? 0 : -8 }}
                    >
                      <AvatarFallback className="bg-muted text-[10px] font-medium">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {memberCount === 1
                    ? 'חבר אחד כבר בסביבה'
                    : `${memberCount} חברים כבר בסביבה`}
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-3 rounded-full bg-muted px-3 py-2">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-background text-[10px] font-medium">
                  {initialsFrom(
                    invite.invitedByName || invite.invitedByEmail || '?',
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-medium">{inviterName}</p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {invite.invitedByEmail || invite.email}
                </p>
              </div>
            </div>

            <p
              className="rounded-full bg-muted/70 px-5 py-3 text-center text-sm text-muted-foreground"
              dir="ltr"
            >
              {invite.email}
            </p>
          </>
        ) : null}

        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
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
            ) : (
              <Button
                asChild
                variant="outline"
                className={authFieldClasses.buttonOutline}
              >
                <Link href={ROUTES.login}>דחייה</Link>
              </Button>
            )}
          </div>
        ) : null}

        {isAccepted ? (
          <Button asChild className={authFieldClasses.button}>
            <Link href={ROUTES.entry}>המשך לסביבה</Link>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}
