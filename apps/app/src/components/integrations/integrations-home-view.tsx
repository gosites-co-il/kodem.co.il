'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon } from 'lucide-react';
import type {
  ConnectionCatalogItem,
  WorkspaceConnection,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import { Switch } from '@kodem/design-system/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@kodem/design-system/components/ui/tabs';
import { api, isApiError } from '../../lib/api';
import { can } from '../../lib/auth/permissions';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { FeaturedIntegrations } from './featured-integrations';
import { IntegrationIcon } from './integration-icons';

const CATEGORY_LABELS: Record<string, string> = {
  productivity: 'פרודוקטיביות',
  analytics: 'אנליטיקה',
  local: 'נוכחות מקומית',
  social: 'רשתות חברתיות',
  advertising: 'פרסום',
  messaging: 'הודעות',
};

const HOW_TO_STEPS = [
  {
    title: 'בחרו חיבור',
    body: 'פתחו את קטלוג החיבורים ובחרו את השירות הרלוונטי.',
  },
  {
    title: 'התחברו לספק',
    body: 'OAuth ל־Google, או Meta Embedded Signup לוואטסאפ.',
  },
  {
    title: 'הפעילו',
    body: 'ודאו שהחיבור במצב פעיל — רק אז אפשר להשתמש בו במערכת.',
  },
  {
    title: 'הגדירו ערוץ',
    body: 'לחיווי ללקוחות — חברו ערוץ תקשורת על בסיס החיבור.',
  },
] as const;

function linkedConnections(item: ConnectionCatalogItem): WorkspaceConnection[] {
  const list = item.connections?.length
    ? item.connections
    : item.connection
      ? [item.connection]
      : [];
  return list.filter((c) => c.status === 'connected' || c.status === 'inactive');
}

function isLinked(item: ConnectionCatalogItem): boolean {
  return linkedConnections(item).length > 0;
}

function primaryConnection(
  item: ConnectionCatalogItem,
): WorkspaceConnection | null {
  const linked = linkedConnections(item);
  return linked.find((c) => c.active) ?? linked[0] ?? null;
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function linkHint(item: ConnectionCatalogItem): string {
  if (item.status === 'coming_soon') return 'בקרוב';
  if (isLinked(item)) return 'ניהול החיבור';
  return 'חיבור חדש';
}

export function IntegrationsHomeView() {
  const { role } = useAuth();
  const canManage = can(role, 'connections:manage');
  const [catalog, setCatalog] = useState<ConnectionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>(
    'all',
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listConnectionsCatalog();
      setCatalog(res.catalog);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הקטלוג נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return catalog.filter((item) => {
      if (filter === 'connected') return isLinked(item);
      if (filter === 'disconnected') return !isLinked(item);
      return true;
    });
  }, [catalog, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ConnectionCatalogItem[]>();
    for (const item of filtered) {
      const key = item.category || 'other';
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  async function toggleActive(item: ConnectionCatalogItem, next: boolean) {
    const conn = primaryConnection(item);
    if (!conn || !canManage) return;
    setBusyId(conn.id);
    setError(null);
    try {
      const res = await api.setConnectionActive(conn.id, next);
      if (!res.success) {
        setError(res.message ?? 'עדכון הסטטוס נכשל');
        return;
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'עדכון הסטטוס נכשל');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-16">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <FeaturedIntegrations catalog={catalog} />

      {/* Connections vs channels + how-to */}
      <section
        aria-labelledby="integrations-explain-title"
        className="flex flex-col gap-8"
      >
        <div className="max-w-2xl">
          <h2
            id="integrations-explain-title"
            className="text-2xl font-bold tracking-tight"
          >
            איך זה עובד?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            חיבורים וערוצים עובדים יחד — אבל הם לא אותו דבר.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-lg border bg-card md:grid-cols-2">
          <div className="flex flex-col gap-3 border-b p-6 md:border-b-0 md:border-e">
            <h3 className="text-base font-semibold">חיבור</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              קישור מוגדר בין סביבת העבודה לספק חיצוני — למשל Google Sheets או
              WhatsApp Business. הטוקנים נשמרים מוצפנים. אפשר לחבר, לנתק,
              ולהפעיל או לכבות בלי לאבד את ההרשאות.
            </p>
            <Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
              <Link href={ROUTES.workspaceIntegrationsConnections}>
                ניהול חיבורים
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-3 p-6">
            <h3 className="text-base font-semibold">ערוץ</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              מדיום תקשורת מול לקוחות — אימייל, WhatsApp, Instagram, Messenger.
              הערוץ נשען על חיבור אחד או יותר, בלי להטמיע לוגיקה של ספק ספציפי.
            </p>
            <Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
              <Link href={ROUTES.workspaceIntegrationsChannels}>
                ניהול ערוצים
              </Link>
            </Button>
          </div>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {HOW_TO_STEPS.map((item, index) => (
            <li key={item.title} className="flex flex-col gap-2">
              <p className="text-sm font-semibold tabular-nums text-primary">
                {index + 1}. {item.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Catalog grid — integration15 */}
      <section
        aria-labelledby="integrations-catalog-title"
        className="grid items-start gap-10 xl:grid-cols-[minmax(0,20rem)_1fr] xl:gap-14"
      >
        <div className="flex flex-col gap-3">
          <h2
            id="integrations-catalog-title"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            כל הכלים במקום אחד
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            עברו על הרשימה, פתחו חיבור לניהול מפורט, או התחילו חיבור חדש ישירות
            מדף החיבורים.
          </p>
          <Button className="mt-1 w-fit" asChild>
            <Link href={ROUTES.workspaceIntegrationsConnections}>
              התחילו לחבר
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-md" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </li>
              ))
            : catalog.map((item) => (
                <li key={item.integrationId}>
                  <Link
                    href={`${ROUTES.workspaceIntegrationsConnections}/${item.integrationId}`}
                    className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-white p-1.5">
                      <IntegrationIcon
                        id={item.integrationId}
                        className="size-6"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                        <BookOpenIcon className="size-3 shrink-0 opacity-70" />
                        <span className="truncate">{linkHint(item)}</span>
                        <ArrowLeftIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
        </ul>
      </section>

      {/* Status tabs — integration11 */}
      <section
        aria-labelledby="integrations-status-title"
        className="flex flex-col gap-6"
      >
        <div>
          <h2
            id="integrations-status-title"
            className="text-2xl font-bold tracking-tight"
          >
            סטטוס חיבורים
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            סננו לפי מצב, הפעילו או כבו חיבור קיים, ופתחו את פרטי הניהול.
          </p>
        </div>

        <Tabs
          dir="rtl"
          value={filter}
          onValueChange={(v) =>
            setFilter(v as 'all' | 'connected' | 'disconnected')
          }
        >
          <TabsList className="h-auto w-fit flex-wrap justify-start">
            <TabsTrigger value="all">כל היישומים</TabsTrigger>
            <TabsTrigger value="connected">מחוברים</TabsTrigger>
            <TabsTrigger value="disconnected">לא מחוברים</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 flex flex-col gap-10 text-start">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-lg" />
                ))}
              </div>
            ) : grouped.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                אין חיבורים בקטגוריה זו.
              </p>
            ) : (
              grouped.map(([category, items]) => (
                <div key={category} className="flex flex-col gap-4 text-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {categoryLabel(category)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {items.length === 1
                        ? 'יישום אחד בקטגוריה'
                        : `${items.length} יישומים בקטגוריה`}
                    </p>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => {
                      const linked = isLinked(item);
                      const conn = primaryConnection(item);
                      const active = Boolean(conn?.active);
                      const busy = busyId === conn?.id;
                      return (
                        <li key={item.integrationId}>
                          <Card className="h-full text-start transition-colors hover:bg-muted/30">
                            <CardHeader className="gap-3">
                              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-white p-2">
                                <IntegrationIcon
                                  id={item.integrationId}
                                  className="size-7"
                                />
                              </div>
                              <CardTitle className="text-base">
                                {item.name}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {item.description}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`${ROUTES.workspaceIntegrationsConnections}/${item.integrationId}`}
                                >
                                  פרטים
                                </Link>
                              </Button>
                              <div className="flex items-center gap-2">
                                <label
                                  htmlFor={`active-${item.integrationId}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  {linked
                                    ? active
                                      ? 'פעיל'
                                      : 'כבוי'
                                    : item.status === 'coming_soon'
                                      ? 'בקרוב'
                                      : 'לא מחובר'}
                                </label>
                                <Switch
                                  id={`active-${item.integrationId}`}
                                  checked={linked && active}
                                  disabled={
                                    !linked ||
                                    !canManage ||
                                    busy ||
                                    item.status !== 'available'
                                  }
                                  onCheckedChange={(checked) => {
                                    void toggleActive(item, checked);
                                  }}
                                  aria-label={`הפעלה של ${item.name}`}
                                />
                              </div>
                            </CardFooter>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
