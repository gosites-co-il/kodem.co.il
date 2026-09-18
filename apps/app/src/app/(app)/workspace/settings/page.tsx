'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleName } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@kodem/design-system/components/ui/tabs';
import {
  api,
  isApiError,
  type MemberListItem,
} from '../../../../lib/api';
import type { BillingSnapshot, WorkspaceInvite } from '@kodem/contracts';
import { can } from '../../../../lib/auth/permissions';
import { ROUTES } from '../../../../lib/constants';
import { useAuth } from '../../../../providers/auth-provider';

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { user, workspace, role, refreshSession } = useAuth();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>('member');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canReadMembers = can(role, 'workspace.members.read');
  const canInvite = can(role, 'workspace.members.invite');
  const canUpdateMembers = can(role, 'workspace.members.update');
  const canRemoveMembers = can(role, 'workspace.members.remove');
  const canReadBilling = can(role, 'workspace.billing.read');
  const canManageBilling = can(role, 'workspace.billing.manage');
  const canLifecycle = can(role, 'workspace.lifecycle.manage');

  const load = useCallback(async () => {
    setError(null);
    try {
      const tasks: Promise<void>[] = [];
      if (canReadMembers) {
        tasks.push(
          api.listMembers().then((memberData) => {
            setMembers(memberData.members);
            setInvites(memberData.invites);
          }),
        );
      }
      if (canReadBilling) {
        tasks.push(
          api
            .getBilling()
            .then(setBilling)
            .catch(() => setBilling(null)),
        );
      }
      await Promise.all(tasks);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת ההגדרות נכשלה');
    }
  }, [canReadBilling, canReadMembers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await api.inviteMember({ email, role: inviteRole });
      setEmail('');
      setInfo('ההזמנה נשלחה');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שליחת הזמנה נכשלה');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">כללי</TabsTrigger>
          {canReadMembers ? (
            <TabsTrigger value="members">חברים</TabsTrigger>
          ) : null}
          {canReadBilling ? (
            <TabsTrigger value="billing">חיוב</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">שם</p>
            <p className="text-sm text-muted-foreground">{workspace?.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">מזהה</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {workspace?.slug}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">התפקיד שלכם</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              void api
                .leaveWorkspace()
                .then(() => refreshSession())
                .catch((err) =>
                  setError(isApiError(err) ? err.message : 'עזיבה נכשלה'),
                )
            }
          >
            עזיבת הסביבה
          </Button>
          {canLifecycle ? (
            <Button
              variant="destructive"
              onClick={() =>
                void api
                  .deactivateWorkspace()
                  .then(() => {
                    setInfo('הסביבה הושבתה');
                    router.replace(ROUTES.entry);
                  })
                  .catch((err) =>
                    setError(
                      isApiError(err) ? err.message : 'השבתת הסביבה נכשלה',
                    ),
                  )
              }
            >
              השבתת הסביבה
            </Button>
          ) : null}
        </TabsContent>

        {canReadMembers ? (
          <TabsContent value="members" className="space-y-6 pt-4">
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{m.name || m.email}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {m.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpdateMembers && m.userId !== user?.id ? (
                      <select
                        className="rounded-md border bg-background px-2 py-1 text-sm"
                        value={m.role}
                        onChange={(e) =>
                          void api
                            .changeMemberRole(
                              m.userId,
                              e.target.value as RoleName,
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
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                        {m.role === 'owner' ? (
                          <option value="owner">owner</option>
                        ) : null}
                      </select>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {m.role}
                      </span>
                    )}
                    {canRemoveMembers &&
                    m.userId !== user?.id &&
                    m.role !== 'owner' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void api
                            .removeMember(m.userId)
                            .then(load)
                            .catch((err) =>
                              setError(
                                isApiError(err) ? err.message : 'הסרה נכשלה',
                              ),
                            )
                        }
                      >
                        הסרה
                      </Button>
                    ) : null}
                    {canLifecycle && m.userId !== user?.id ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void api
                            .transferOwnership(m.userId)
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
                </li>
              ))}
            </ul>

            {invites.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">הזמנות ממתינות</p>
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span dir="ltr">{inv.email}</span>
                    {canInvite ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void api
                            .resendInvite(inv.id)
                            .then(() => setInfo('נשלח מחדש'))
                        }
                      >
                        שליחה מחדש
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {canInvite ? (
              <form onSubmit={invite} className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">הזמנת חבר</p>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">אימייל</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">תפקיד</Label>
                  <select
                    id="invite-role"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as RoleName)}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <Button type="submit">שליחת הזמנה</Button>
              </form>
            ) : null}
          </TabsContent>
        ) : null}

        {canReadBilling ? (
          <TabsContent value="billing" className="space-y-4 pt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">תוכנית נוכחית</p>
              <p className="text-sm text-muted-foreground">
                {billing?.subscription.planId ?? 'free'} (
                {billing?.subscription.status ?? 'active'})
              </p>
            </div>

            {billing?.entitlements ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">מודולים כלולים</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    {billing.entitlements.modules.map((moduleId) => (
                      <li key={moduleId} dir="ltr">
                        {moduleId}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">מגבלות</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {Object.entries(billing.entitlements.limits).map(
                      ([metric, limit]) => (
                        <li key={metric} dir="ltr">
                          {metric}: {limit === null ? 'unlimited' : limit}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            ) : null}

            {canManageBilling ? (
              <Button
                onClick={() =>
                  void api
                    .upgradeIntent('starter')
                    .then((r) =>
                      setInfo(
                        r.configured
                          ? 'Upgrade started'
                          : r.message || 'Billing is not configured',
                      ),
                    )
                    .catch((err) =>
                      setError(isApiError(err) ? err.message : 'שדרוג נכשל'),
                    )
                }
              >
                שדרוג
              </Button>
            ) : null}
            {billing && !billing.configured ? (
              <p className="text-xs text-muted-foreground">
                חיוב עדיין לא הוגדר בסביבה זו.
              </p>
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
