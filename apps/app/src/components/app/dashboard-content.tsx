'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MessageCircleIcon } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@kodem/design-system/components/ui/sheet';
import { api, isApiError } from '../../lib/api';
import { can } from '../../lib/auth/permissions';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { IntegrationIcon } from '../integrations/integration-icons';
import { WhatsAppSignupWizard } from '../integrations/whatsapp-signup-wizard';

const SUGGESTED_ACTIONS = [
  { label: 'חברו Google Analytics', href: '/workspace/integrations/connections' },
  { label: 'הוסיפו אנשי קשר', href: '/crm/contacts' },
  { label: 'הזמינו חברי צוות', href: '/workspace/settings' },
  { label: 'צרו קמפיין ראשון', href: '#' },
];

function hasLinkedWhatsApp(
  catalog: Awaited<ReturnType<typeof api.listConnectionsCatalog>>['catalog'],
): boolean {
  const item = catalog.find((c) => c.integrationId === 'whatsapp');
  if (!item) return false;
  const list = item.connections?.length
    ? item.connections
    : item.connection
      ? [item.connection]
      : [];
  return list.some(
    (c) => c.status === 'connected' || c.status === 'inactive',
  );
}

export function DashboardContent() {
  const { user, workspace, role } = useAuth();
  const router = useRouter();
  const canManageConnections = can(role, 'connections:manage');
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<
    ReturnType<typeof api.getWorkspaceOverview>
  > | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(
    null,
  );
  const [whatsappSheetOpen, setWhatsappSheetOpen] = useState(false);

  const refreshConnections = useCallback(async () => {
    try {
      const res = await api.listConnectionsCatalog();
      setWhatsappConnected(hasLinkedWhatsApp(res.catalog));
    } catch (err) {
      if (isApiError(err) && err.status !== 404) {
        console.error(err);
      }
      setWhatsappConnected(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [data] = await Promise.all([
          api.getWorkspaceOverview().catch((err: unknown) => {
            if (isApiError(err) && err.status !== 404) {
              console.error(err);
            }
            return null;
          }),
          refreshConnections(),
        ]);
        setOverview(data);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [refreshConnections]);

  const progress = overview?.discoveryProgress;
  const showWhatsAppCta =
    !isLoading && whatsappConnected === false && canManageConnections;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          שלום, {user?.name?.split(' ')[0] ?? 'שם'}
        </h1>
        <p className="text-muted-foreground">
          {workspace?.name} — סביבת העבודה שלך פעילה
        </p>
      </div>

      {showWhatsAppCta ? (
        <section
          aria-labelledby="dashboard-whatsapp-cta-title"
          className="relative overflow-hidden rounded-lg border bg-card p-5 sm:p-6"
        >
          <div
            className="pointer-events-none absolute inset-y-0 end-0 w-1/3 bg-gradient-to-l from-secondary/15 to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                <IntegrationIcon id="whatsapp" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h2
                  id="dashboard-whatsapp-cta-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  חבר את מספר הוואטסאפ שלך
                </h2>
                <p className="text-sm text-muted-foreground">
                  חברו את מספר העסק דרך Meta — ואז תוכלו לקבל ולשלוח הודעות
                  מהמערכת.
                </p>
                <p className="text-xs text-muted-foreground">
                  החיבור רשמי ומאובטח דרך Meta · אפשר להתנתק בכל רגע
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setWhatsappSheetOpen(true)}
              >
                <MessageCircleIcon data-icon="inline-start" />
                חבר מספר וואטסאפ
              </Button>
              <Link
                href={ROUTES.workspaceIntegrationsConnections}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                לכל החיבורים
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <Sheet open={whatsappSheetOpen} onOpenChange={setWhatsappSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <SheetHeader className="gap-3 border-b p-6 text-start">
            <div className="flex items-start gap-3 pe-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                <IntegrationIcon id="whatsapp" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle>WhatsApp</SheetTitle>
                <SheetDescription>
                  חיבור מספר עסקי דרך Meta Embedded Signup
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex flex-col gap-6 p-6">
            <WhatsAppSignupWizard
              canManage={canManageConnections}
              onComplete={async () => {
                await refreshConnections();
                setWhatsappSheetOpen(false);
                router.push(
                  `${ROUTES.workspaceIntegrationsConnections}/whatsapp`,
                );
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">סטטוס סביבה</CardTitle>
            <CardDescription>הכול מוכן לעבודה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatusRow label="Workspace" done />
            <StatusRow label="CRM" done />
            <StatusRow
              label="בסיס ידע"
              done={progress?.profile}
              loading={!progress?.profile}
            />
            <StatusRow label="AI" done />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">התקדמות גילוי</CardTitle>
            <CardDescription>ממשיך ברקע</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StatusRow
              label="אתר"
              done={progress?.website}
              loading={!progress?.website}
            />
            <StatusRow
              label="פרופיל עסקי"
              done={progress?.profile}
              loading={!progress?.profile && !isLoading}
            />
            <StatusRow
              label="תובנות"
              done={progress?.insights}
              loading={!progress?.insights && !isLoading}
            />
            <StatusRow
              label="המלצות"
              done={progress?.recommendations}
              loading={!progress?.recommendations && !isLoading}
            />
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
            <Button key={action.label} variant="secondary" size="sm" asChild>
              <Link href={action.href}>{action.label}</Link>
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
        <Loader2
          className="size-4 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : (
        <span className="size-4 rounded-full border" aria-hidden />
      )}
      <span className={done ? undefined : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
