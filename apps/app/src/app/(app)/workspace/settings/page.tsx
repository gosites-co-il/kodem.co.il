'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../../../../providers/auth-provider';

export default function WorkspaceSettingsPage() {
  const { user, workspace, role, refreshSession } = useAuth();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>('member');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const canManage = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  const load = useCallback(async () => {
    setError(null);
    try {
      const [memberData, billingData] = await Promise.all([
        api.listMembers(),
        api.getBilling().catch(() => null),
      ]);
      setMembers(memberData.members);
      setInvites(memberData.invites);
      setBilling(billingData);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת ההגדרות נכשלה');
    }
  }, []);

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות סביבה</h1>
        <p className="text-sm text-muted-foreground">
          {workspace?.name ?? 'סביבת העבודה'}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">כללי</TabsTrigger>
          <TabsTrigger value="members">חברים</TabsTrigger>
          <TabsTrigger value="billing">חיוב</TabsTrigger>
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
              void api.leaveWorkspace().then(() => refreshSession())
            }
          >
            עזיבת הסביבה
          </Button>
        </TabsContent>

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
                  {canManage && m.userId !== user?.id ? (
                    <select
                      className="rounded-md border bg-background px-2 py-1 text-sm"
                      value={m.role}
                      onChange={(e) =>
                        void api
                          .changeMemberRole(m.userId, e.target.value as RoleName)
                          .then(load)
                          .catch((err) =>
                            setError(
                              isApiError(err) ? err.message : 'שינוי תפקיד נכשל',
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
                    <span className="text-sm text-muted-foreground">{m.role}</span>
                  )}
                  {canManage && m.userId !== user?.id && m.role !== 'owner' ? (
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
                  {isOwner && m.userId !== user?.id ? (
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void api.resendInvite(inv.id).then(() => setInfo('נשלח מחדש'))
                    }
                  >
                    שליחה מחדש
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {canManage ? (
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

        <TabsContent value="billing" className="space-y-4 pt-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">תוכנית נוכחית</p>
            <p className="text-sm text-muted-foreground">
              {billing?.subscription.planId ?? 'free'} (
              {billing?.subscription.status ?? 'active'})
            </p>
          </div>
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
          {billing && !billing.configured ? (
            <p className="text-xs text-muted-foreground">
              חיוב עדיין לא הוגדר בסביבה זו.
            </p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
