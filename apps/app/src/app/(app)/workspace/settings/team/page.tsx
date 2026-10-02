'use client';

import { useCallback, useEffect, useState } from 'react';
import { SystemRole, type RoleName, type WorkspaceInvite } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kodem/design-system/components/ui/table';
import { api, isApiError, type MemberListItem } from '../../../../../lib/api';
import { can } from '../../../../../lib/auth/permissions';
import { useAuth } from '../../../../../providers/auth-provider';

const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'סופר־אדמין',
  owner: 'בעלים',
  admin: 'מנהל',
  member: 'חבר',
  viewer: 'צופה',
};

const selectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function formatDate(value: Date | string | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function isExpired(invite: WorkspaceInvite): boolean {
  const expires = new Date(invite.expiresAt);
  return Number.isFinite(expires.getTime()) && expires.getTime() < Date.now();
}

function TableSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function SettingsTeamPage() {
  const { user, role, refreshSession } = useAuth();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>(SystemRole.Member);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canReadMembers = can(role, 'workspace.members.read');
  const canInvite = can(role, 'workspace.members.invite');
  const canUpdateMembers = can(role, 'workspace.members.update');
  const canRemoveMembers = can(role, 'workspace.members.remove');
  const canLifecycle = can(role, 'workspace.lifecycle.manage');
  const canAssignSuperAdmin =
    role === SystemRole.Owner || role === SystemRole.SuperAdmin;

  const load = useCallback(async () => {
    if (!canReadMembers) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const memberData = await api.listMembers();
      setMembers(memberData.members);
      setInvites(memberData.invites.filter((invite) => invite.status === 'pending'));
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הצוות נכשלה');
    } finally {
      setLoading(false);
    }
  }, [canReadMembers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setInviting(true);
    try {
      await api.inviteMember({ email, role: inviteRole });
      setEmail('');
      setInfo('ההזמנה נשלחה. היא תופיע בטבלת ההזמנות הממתינות עד לאישור.');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שליחת הזמנה נכשלה');
    } finally {
      setInviting(false);
    }
  }

  async function removeInvite(inviteId: string) {
    setError(null);
    setInfo(null);
    setDeletingId(inviteId);
    try {
      await api.deleteInvite(inviteId);
      setInfo('ההזמנה נמחקה. הקישור כבר לא פעיל.');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת ההזמנה נכשלה');
    } finally {
      setDeletingId(null);
    }
  }

  async function resend(inviteId: string) {
    setError(null);
    setInfo(null);
    setResendingId(inviteId);
    try {
      await api.resendInvite(inviteId);
      setInfo('ההזמנה נשלחה שוב.');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שליחה מחדש נכשלה');
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">צוות</h2>
        <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">
          הזמינו אנשים לפי כתובת אימייל. הם מקבלים קישור להצטרפות לסביבה, וההזמנה
          נשארת ממתינה עד שהם מאשרים או שהתוקף פג. אם ההזמנה לא הגיעה, שלחו אותה
          שוב מהטבלה, או למחוק אותה. מחיקה מבטלת את הקישור. חבר עובד בסביבה. מנהל
          יכול גם להזמין אנשים ולשנות תפקידים.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-muted-foreground" role="status">
          {info}
        </p>
      ) : null}

      {!canReadMembers ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              אין לכם הרשאה לצפות בצוות.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">חברים</CardTitle>
              <CardDescription>
                מי שנמצא כבר בסביבה, והתפקיד שלו.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <p className="sr-only">טוען את הצוות</p>
                  <TableSkeleton />
                </>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין חברים להצגה.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">שם</TableHead>
                      <TableHead className="text-start">אימייל</TableHead>
                      <TableHead className="text-start">תפקיד</TableHead>
                      <TableHead className="text-start">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name || member.email}
                        </TableCell>
                        <TableCell dir="ltr" className="text-start">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          {canUpdateMembers && member.userId !== user?.id ? (
                            <select
                              className={`${selectClass} h-9 w-auto`}
                              aria-label={`תפקיד של ${member.email}`}
                              value={member.role}
                              onChange={(event) =>
                                void api
                                  .changeMemberRole(
                                    member.userId,
                                    event.target.value as RoleName,
                                  )
                                  .then(load)
                                  .catch((err) =>
                                    setError(
                                      isApiError(err)
                                        ? err.message
                                        : 'שינוי תפקיד נכשל',
                                    ),
                                  )
                              }
                            >
                              <option value={SystemRole.Admin}>
                                {ROLE_LABELS.admin}
                              </option>
                              <option value={SystemRole.Member}>
                                {ROLE_LABELS.member}
                              </option>
                              <option value={SystemRole.Viewer}>
                                {ROLE_LABELS.viewer}
                              </option>
                              {member.role === SystemRole.Owner ? (
                                <option value={SystemRole.Owner}>
                                  {ROLE_LABELS.owner}
                                </option>
                              ) : null}
                              {canAssignSuperAdmin ||
                              member.role === SystemRole.SuperAdmin ? (
                                <option value={SystemRole.SuperAdmin}>
                                  {ROLE_LABELS.super_admin}
                                </option>
                              ) : null}
                            </select>
                          ) : (
                            <span>{ROLE_LABELS[member.role] ?? member.role}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {canRemoveMembers &&
                            member.userId !== user?.id &&
                            member.role !== SystemRole.Owner &&
                            (member.role !== SystemRole.SuperAdmin ||
                              role === SystemRole.SuperAdmin) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void api
                                    .removeMember(member.userId)
                                    .then(load)
                                    .catch((err) =>
                                      setError(
                                        isApiError(err)
                                          ? err.message
                                          : 'הסרה נכשלה',
                                      ),
                                    )
                                }
                              >
                                הסרה
                              </Button>
                            ) : null}
                            {canLifecycle && member.userId !== user?.id ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  void api
                                    .transferOwnership(member.userId)
                                    .then(() => refreshSession())
                                    .then(load)
                                    .catch((err) =>
                                      setError(
                                        isApiError(err)
                                          ? err.message
                                          : 'העברת בעלות נכשלה',
                                      ),
                                    )
                                }
                              >
                                העברת בעלות
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">הזמנות ממתינות</CardTitle>
              <CardDescription>
                הזמנות שנשלחו ועדיין לא אושרו. אפשר לשלוח שוב, או למחוק כדי לבטל
                את הקישור.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">אימייל</TableHead>
                      <TableHead className="text-start">תפקיד</TableHead>
                      <TableHead className="text-start">נשלחה</TableHead>
                      <TableHead className="text-start">בתוקף עד</TableHead>
                      <TableHead className="text-start">סטטוס</TableHead>
                      {canInvite ? (
                        <TableHead className="text-start">פעולה</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canInvite ? 6 : 5}
                          className="text-muted-foreground"
                        >
                          אין הזמנות ממתינות. שלחו הזמנה והיא תופיע כאן עד לאישור.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invites.map((invite) => {
                        const expired = isExpired(invite);
                        return (
                          <TableRow key={invite.id}>
                            <TableCell dir="ltr" className="text-start">
                              {invite.email}
                            </TableCell>
                            <TableCell>
                              {ROLE_LABELS[invite.role] ?? invite.role}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(invite.createdAt)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(invite.expiresAt)}
                            </TableCell>
                            <TableCell>
                              {expired ? 'פג תוקף' : 'ממתינה'}
                            </TableCell>
                            {canInvite ? (
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      resendingId === invite.id ||
                                      deletingId === invite.id
                                    }
                                    onClick={() => void resend(invite.id)}
                                  >
                                    {resendingId === invite.id
                                      ? 'שולחים…'
                                      : 'שליחה מחדש'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={
                                      resendingId === invite.id ||
                                      deletingId === invite.id
                                    }
                                    onClick={() => void removeInvite(invite.id)}
                                  >
                                    {deletingId === invite.id
                                      ? 'מוחקים…'
                                      : 'מחיקה'}
                                  </Button>
                                </div>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {canInvite ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">הזמנת חבר</CardTitle>
                <CardDescription>
                  ההזמנה נשלחת לאימייל שתכתבו, בתפקיד שתבחרו.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={invite} className="max-w-md space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">אימייל</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      required
                      dir="ltr"
                      autoComplete="email"
                      value={email}
                      disabled={inviting}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">תפקיד</Label>
                    <select
                      id="invite-role"
                      className={selectClass}
                      value={inviteRole}
                      disabled={inviting}
                      onChange={(event) =>
                        setInviteRole(event.target.value as RoleName)
                      }
                    >
                      <option value={SystemRole.Member}>{ROLE_LABELS.member}</option>
                      <option value={SystemRole.Admin}>{ROLE_LABELS.admin}</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'שולחים…' : 'שליחת הזמנה'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
