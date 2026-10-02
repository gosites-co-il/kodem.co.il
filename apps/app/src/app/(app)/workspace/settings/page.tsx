'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  BillingSnapshot,
  BusinessRecordField,
  BusinessRecordView,
  OnboardingStatus,
  PlanId,
  RoleName,
  UsageMetric,
  WorkspaceStatus,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError } from '../../../../lib/api';
import { can } from '../../../../lib/auth/permissions';
import { ROUTES } from '../../../../lib/constants';
import { useAuth } from '../../../../providers/auth-provider';

const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'סופר־אדמין',
  owner: 'בעלים',
  admin: 'מנהל',
  member: 'חבר',
  viewer: 'צופה',
};

const STATUS_LABELS: Record<WorkspaceStatus, string> = {
  active: 'פעילה',
  suspended: 'מושעית',
  onboarding: 'בהקמה',
  deactivated: 'מושבתת',
};

const ONBOARDING_LABELS: Record<OnboardingStatus, string> = {
  NOT_STARTED: 'לא התחילה',
  IN_PROGRESS: 'בתהליך',
  COMPLETED: 'הושלמה',
};

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'חינם',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

const MODULE_LABELS: Record<string, string> = {
  crm: 'CRM',
  knowledge: 'ידע',
  insights: 'תובנות',
  digital_card: 'כרטיס דיגיטלי',
  campaign_manager: 'קמפיינים',
  automation: 'אוטומציה',
  external_ai: 'AI חיצוני',
};

const LIMIT_LABELS: Record<UsageMetric, string> = {
  members: 'חברי צוות',
  events: 'אירועים',
  ai_requests: 'בקשות AI',
  workspaces: 'סביבות עבודה',
};

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(date);
}

function ConfigRows({
  rows,
}: {
  rows: { label: string; value: string; ltr?: boolean }[];
}) {
  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-medium" dir={row.ltr ? 'ltr' : undefined}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FieldList({ fields }: { fields: BusinessRecordField[] }) {
  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">אין נתונים עדיין.</p>;
  }
  return (
    <dl className="divide-y">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-sm text-muted-foreground">{field.label}</dt>
          <dd className="max-w-[36ch] text-end text-sm font-medium">
            <span className="whitespace-pre-wrap">{field.value}</span>
            {field.sourceLabel ? (
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                {field.sourceLabel}
              </p>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { workspace, role, refreshSession } = useAuth();
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [record, setRecord] = useState<BusinessRecordView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canReadBilling = can(role, 'workspace.billing.read');
  const canManageBilling = can(role, 'workspace.billing.manage');
  const canLifecycle = can(role, 'workspace.lifecycle.manage');

  const load = useCallback(async () => {
    setError(null);
    const tasks: Promise<void>[] = [
      api
        .getBusinessRecord()
        .then(setRecord)
        .catch(() => setRecord(null)),
    ];
    if (canReadBilling) {
      tasks.push(
        api
          .getBilling()
          .then(setBilling)
          .catch(() => setBilling(null)),
      );
    } else {
      setBilling(null);
    }
    await Promise.all(tasks);
  }, [canReadBilling]);

  useEffect(() => {
    void load();
  }, [load]);

  const planId = billing?.subscription.planId ?? 'free';

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי הסביבה</CardTitle>
          <CardDescription>הזהות והסטטוס של סביבת העבודה</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigRows
            rows={[
              { label: 'שם', value: display(workspace?.name) },
              { label: 'מזהה', value: display(workspace?.slug), ltr: true },
              {
                label: 'סטטוס',
                value: workspace ? STATUS_LABELS[workspace.status] : '—',
              },
              {
                label: 'התפקיד שלכם',
                value: role ? ROLE_LABELS[role] : '—',
              },
              { label: 'אתר', value: display(workspace?.websiteUrl), ltr: true },
              { label: 'תחום', value: display(workspace?.industry) },
              { label: 'גודל העסק', value: display(workspace?.businessSize) },
              {
                label: 'הקמה',
                value: workspace
                  ? ONBOARDING_LABELS[workspace.onboardingStatus]
                  : '—',
              },
              { label: 'נוצרה', value: formatDate(workspace?.createdAt) },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">זהות העסק</CardTitle>
          <CardDescription>השם, התחום והאתר כפי שנשמרו בפרופיל</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldList fields={record?.sections.identity ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי קשר</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldList fields={record?.sections.contacts ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">שירותים</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldList fields={record?.sections.offers ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">שעות פעילות</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldList fields={record?.sections.hours ?? []} />
        </CardContent>
      </Card>

      {canReadBilling ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תוכנית</CardTitle>
            <CardDescription>
              {PLAN_LABELS[planId]} · {billing?.subscription.status ?? 'active'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing?.entitlements ? (
              <>
                <div>
                  <p className="text-sm font-medium">מודולים</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {billing.entitlements.modules.map((moduleId) => (
                      <li
                        key={moduleId}
                        className="rounded-md bg-muted px-2 py-1 text-sm"
                      >
                        {MODULE_LABELS[moduleId] ?? moduleId}
                      </li>
                    ))}
                  </ul>
                </div>
                <ConfigRows
                  rows={Object.entries(billing.entitlements.limits).map(
                    ([metric, limit]) => ({
                      label: LIMIT_LABELS[metric as UsageMetric] ?? metric,
                      value: limit === null ? 'ללא מגבלה' : String(limit),
                    }),
                  )}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">התוכנית לא נטענה.</p>
            )}
            {canManageBilling ? (
              <Button
                onClick={() =>
                  void api
                    .upgradeIntent('starter')
                    .then((r) =>
                      setInfo(
                        r.configured
                          ? 'השדרוג התחיל'
                          : r.message || 'חיוב עדיין לא הוגדר',
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
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">אזור סכנה</CardTitle>
          <CardDescription>
            עזיבה מוציאה אתכם מהסביבה. השבתה סוגרת אותה לכל החברים.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
