'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  SystemRole,
  type AdminWorkspaceDetail,
  type PlanId,
  type RoleName,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kodem/design-system/components/ui/table';
import { api, isApiError } from '../../../../../lib/api';
import { ROUTES } from '../../../../../lib/constants';

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  suspended: 'מושעה',
  onboarding: 'בהקמה',
  deactivated: 'מושבת',
  NOT_STARTED: 'לא התחיל',
  IN_PROGRESS: 'בתהליך',
  COMPLETED: 'הושלם',
};

const ROLE_OPTIONS: { value: RoleName; label: string }[] = [
  { value: SystemRole.SuperAdmin, label: 'סופר־אדמין' },
  { value: SystemRole.Admin, label: 'מנהל' },
  { value: SystemRole.Member, label: 'חבר' },
  { value: SystemRole.Viewer, label: 'צופה' },
];

function roleLabel(role: RoleName): string {
  if (role === SystemRole.Owner) return 'בעלים';
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export default function AdminWorkspaceDetailPage() {
  const params = useParams<{ id: string }>();
  const workspaceId = params.id;
  const [detail, setDetail] = useState<AdminWorkspaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDetail(await api.adminWorkspaceDetail(workspaceId));
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הסביבה נכשלה');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(userId: string, role: RoleName) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await api.adminUpdateMemberRole(workspaceId, userId, role));
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שינוי התפקיד נכשל');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={ROUTES.adminWorkspaces}>חזרה לסביבות</Link>
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">טוען…</p>
      ) : detail ? (
        <>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{detail.workspace.name}</h2>
            <p className="text-sm text-muted-foreground">
              {detail.owner.name} · {PLAN_LABELS[detail.planId]} ·{' '}
              {STATUS_LABELS[detail.workspace.status] ?? detail.workspace.status} ·{' '}
              {STATUS_LABELS[detail.workspace.onboardingStatus] ??
                detail.workspace.onboardingStatus}
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">חברים</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">שם</TableHead>
                  <TableHead className="text-start">אימייל</TableHead>
                  <TableHead className="text-start">תפקיד</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell dir="ltr" className="text-start">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      {member.role === SystemRole.Owner ? (
                        <span className="text-sm">{roleLabel(member.role)}</span>
                      ) : (
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={member.role}
                          disabled={busy}
                          aria-label={`תפקיד ${member.name}`}
                          onChange={(event) =>
                            void changeRole(member.userId, event.target.value as RoleName)
                          }
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">הזמנות ממתינות</h3>
            {detail.invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין הזמנות ממתינות.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">אימייל</TableHead>
                    <TableHead className="text-start">תפקיד</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell dir="ltr" className="text-start">
                        {invite.email}
                      </TableCell>
                      <TableCell>{roleLabel(invite.role)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
