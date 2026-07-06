'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError } from '../../lib/api';
import { useAuth } from '../../providers/auth-provider';

const SUGGESTED_ACTIONS = [
  'חברו Google Analytics',
  'ייבאו אנשי קשר',
  'הזמינו חברי צוות',
  'צרו קמפיין ראשון',
];

export function DashboardContent() {
  const { user, workspace, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<
    ReturnType<typeof api.getWorkspaceOverview>
  > | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getWorkspaceOverview();
        setOverview(data);
      } catch (err) {
        if (isApiError(err) && err.status !== 404) {
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const progress = overview?.discoveryProgress;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">דשבורד</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          שלום, {user?.name?.split(' ')[0] ?? 'שם'}
        </h1>
        <p className="text-muted-foreground">
          {workspace?.name} — סביבת העבודה שלך פעילה
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">סטטוס סביבה</CardTitle>
            <CardDescription>הכול מוכן לעבודה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatusRow label="Workspace" done />
            <StatusRow label="CRM" done />
            <StatusRow label="בסיס ידע" done={progress?.profile} loading={!progress?.profile} />
            <StatusRow label="AI" done />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">התקדמות גילוי</CardTitle>
            <CardDescription>ממשיך ברקע</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatusRow label="אתר" done={progress?.website} loading={!progress?.website} />
            <StatusRow label="פרופיל עסקי" done={progress?.profile} loading={!progress?.profile && !isLoading} />
            <StatusRow label="תובנות" done={progress?.insights} loading={!progress?.insights && !isLoading} />
            <StatusRow label="המלצות" done={progress?.recommendations} loading={!progress?.recommendations && !isLoading} />
          </CardContent>
        </Card>
      </div>

      {overview?.primaryRecommendation ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">הצעד הבא המומלץ</CardTitle>
            <CardDescription>
              {overview.primaryRecommendation.action}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overview.primaryRecommendation.rationale}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {overview?.profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ידע עסקי</CardTitle>
            <CardDescription>{overview.profile.name}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {overview.profile.industry ? (
              <p>תחום: {overview.profile.industry}</p>
            ) : null}
            {overview.profile.hypotheses[0] ? (
              <p className="mt-2">{overview.profile.hypotheses[0]}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פעולות מומלצות</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SUGGESTED_ACTIONS.map((action) => (
            <Button key={action} variant="secondary" size="sm" asChild>
              <Link href="#">{action}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground capitalize">
        תפקיד: {role}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  done,
  loading,
}: {
  label: string;
  done?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <Check className="size-4 text-primary" aria-hidden />
      ) : loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <span className="size-4 rounded-full border" aria-hidden />
      )}
      <span className={done ? undefined : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
