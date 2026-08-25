'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@kodem/design-system/components/ui/card';
import type {
  BusinessProfileDraft,
  BusinessReportDraft,
  FieldApproval,
} from '@kodem/contracts';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupSecondaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

function isRunning(report?: BusinessReportDraft, discovered?: { status?: string }) {
  return report?.status === 'running' || discovered?.status === 'running';
}

function isFailed(report?: BusinessReportDraft, discovered?: { status?: string }) {
  return report?.status === 'failed' || discovered?.status === 'failed';
}

export function BusinessUnderstandingScreen({
  state,
  advance,
  isSubmitting,
  error,
  onRefresh,
  restartDiscovery,
  retryDiscovery,
}: SetupScreenProps) {
  const report = state.setup.businessReport;
  const [draft, setDraft] = useState<BusinessReportDraft | null>(report ?? null);
  const [profileDraft, setProfileDraft] = useState<BusinessProfileDraft | null>(
    state.setup.confirmedProfile ?? null,
  );
  const [approvals, setApprovals] = useState<
    Partial<Record<string, FieldApproval>>
  >(report?.fieldApprovals ?? {});
  const [retrying, setRetrying] = useState(false);

  const websiteUrl = state.setup.business?.websiteUrl?.trim();
  const businessName =
    state.setup.business?.name?.trim() || state.workspace.name;

  const running = isRunning(report, state.setup.discovered);
  const failed = isFailed(report, state.setup.discovered);

  useEffect(() => {
    setDraft(state.setup.businessReport ?? null);
    setProfileDraft(state.setup.confirmedProfile ?? null);
    setApprovals(state.setup.businessReport?.fieldApprovals ?? {});
  }, [state.setup.businessReport, state.setup.confirmedProfile]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void onRefresh(), 2500);
    return () => clearInterval(timer);
  }, [running, onRefresh]);

  function setApproval(key: string, patch: Partial<FieldApproval>) {
    setApprovals((current) => ({
      ...current,
      [key]: { approved: false, rejected: false, ...current[key], ...patch },
    }));
  }

  function updateUnderstandingField(
    key: keyof BusinessReportDraft['understanding'],
    value: string,
  ) {
    if (!draft) return;
    const field = draft.understanding[key];
    if (!field || typeof field !== 'object' || !('value' in field)) return;

    setDraft({
      ...draft,
      understanding: {
        ...draft.understanding,
        [key]: {
          ...field,
          value,
          source: 'ai',
        },
      },
    });
    setApproval(String(key), { edited: true, approved: true, rejected: false });
  }

  async function continueManually() {
    const confirmed: BusinessProfileDraft = profileDraft ?? {
      businessName,
      emails: [],
      phones: [],
      addresses: [],
      socialProfiles: [],
      services: [],
      products: [],
      fieldStatus: {},
      website: websiteUrl,
      industry: state.setup.business?.industry,
    };

    if (!confirmed.businessName.trim()) {
      confirmed.businessName = businessName;
    }

    await advance('business_understanding', {
      confirmedProfile: confirmed,
      businessReport: draft
        ? { ...draft, status: 'completed', fieldApprovals: approvals }
        : undefined,
    });
  }

  if ((!draft && !running) || (failed && !running)) {
    return (
      <SetupShell>
        <SetupHeadline
          title="גילוי העסק"
          subtitle={
            failed
              ? 'לא הצלחנו לנתח את האתר. אפשר לנסות שוב, להמשיך ידנית, או לדלג.'
              : 'לא נמצא דוח הבנה. חזרו לשלב הקודם או נסו שוב.'
          }
        />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <SetupSecondaryButton
            disabled={isSubmitting || retrying}
            onClick={() => void restartDiscovery()}
          >
            חזרה לגילוי העסק
          </SetupSecondaryButton>
          {websiteUrl ? (
            <SetupSecondaryButton
              disabled={isSubmitting || retrying}
              onClick={() => {
                setRetrying(true);
                void retryDiscovery(websiteUrl).finally(() => setRetrying(false));
              }}
            >
              {retrying ? 'מריצים גילוי…' : 'נסו שוב'}
            </SetupSecondaryButton>
          ) : null}
          <SetupPrimaryButton
            disabled={isSubmitting || retrying || !businessName.trim()}
            onClick={() => void continueManually()}
          >
            {isSubmitting ? 'שומר…' : 'המשך ידנית'}
          </SetupPrimaryButton>
          <SetupSecondaryButton
            disabled={isSubmitting || retrying || !businessName.trim()}
            onClick={() => void continueManually()}
          >
            דלג לעת עתה
          </SetupSecondaryButton>
        </div>
        {!websiteUrl && !failed ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            לא הוזן אתר — אפשר להמשיך ידנית עם שם העסק בלבד.
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </SetupShell>
    );
  }

  const u = draft?.understanding;

  return (
    <SetupShell centered={false} className="max-w-2xl">
      <SetupHeadline
        title="זה מה שהבנו על העסק שלך"
        subtitle={
          running
            ? 'עדיין לומדים על העסק — אפשר לערוך ולאשר בכל שלב.'
            : 'אשרו, תקנו או דחו שדות בודדים. המטרה היא אישור, לא הזנת נתונים.'
        }
      />

      {running ? (
        <p className="mb-4 text-sm text-muted-foreground">מנתחים מקורות ציבוריים…</p>
      ) : null}

      {u ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">סיכום עסקי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={u.businessSummary.value}
                onChange={(e) => updateUnderstandingField('businessSummary', e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <SetupSecondaryButton
                  onClick={() => setApproval('businessSummary', { approved: true, rejected: false })}
                >
                  אישור
                </SetupSecondaryButton>
                <SetupSecondaryButton
                  onClick={() => setApproval('businessSummary', { rejected: true, approved: false })}
                >
                  דחייה
                </SetupSecondaryButton>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldCard label="תחום" value={u.industry.value} />
            <FieldCard label="מודל עסקי" value={u.businessModel.value} />
            <FieldCard label="קהל יעד" value={u.targetAudience.value} />
            <FieldCard
              label="שירותים עיקריים"
              value={u.mainServices.value.join(', ') || '—'}
            />
          </div>

          {draft.recommendations.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">מודולים מומלצים</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {draft.recommendations
                  .filter((r) => r.type === 'module')
                  .map((r) => (
                    <Badge key={r.id} variant="secondary">
                      {r.label}
                    </Badge>
                  ))}
              </CardContent>
            </Card>
          ) : null}

          {draft.recommendations.some((r) => r.type === 'integration') ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">אינטגרציות מומלצות</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {draft.recommendations
                  .filter((r) => r.type === 'integration')
                  .map((r) => (
                    <Badge key={r.id} variant="outline">
                      {r.label}
                    </Badge>
                  ))}
              </CardContent>
            </Card>
          ) : null}

          {u.missingInformation.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">מידע חסר</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                  {u.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {draft.questions.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">שאלות לבעל העסק</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.questions.map((q) => (
                  <div key={q.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{q.question}</p>
                    <p className="mt-1 text-muted-foreground">{q.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <SetupPrimaryButton
          disabled={isSubmitting || running || !draft}
          onClick={() =>
            void advance('business_understanding', {
              businessReport: draft
                ? { ...draft, fieldApprovals: approvals }
                : undefined,
              confirmedProfile: profileDraft ?? undefined,
            })
          }
        >
          {isSubmitting ? 'שומר…' : 'מאשרים וממשיכים'}
        </SetupPrimaryButton>
      </div>
    </SetupShell>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
