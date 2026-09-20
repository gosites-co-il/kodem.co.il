'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import type {
  ChannelCatalogItem,
  ConnectionCatalogItem,
  ConnectionId,
  WorkspaceConnection,
} from '@kodem/contracts';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { api, isApiError } from '../../lib/api';
import { can } from '../../lib/auth/permissions';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { ChannelIcon } from './integration-icons';

function workspaceConnections(
  catalog: ConnectionCatalogItem[],
): WorkspaceConnection[] {
  const out: WorkspaceConnection[] = [];
  for (const item of catalog) {
    if (item.integrationId !== 'google_workspace') continue;
    const list = item.connections?.length
      ? item.connections
      : item.connection
        ? [item.connection]
        : [];
    for (const c of list) {
      if (c.status === 'connected') out.push(c);
    }
  }
  return out;
}

export function ChannelsCatalogView() {
  const { role } = useAuth();
  const canManage = can(role, 'connections:manage');
  const canUse = can(role, 'connections:use');
  const [catalog, setCatalog] = useState<ChannelCatalogItem[]>([]);
  const [connCatalog, setConnCatalog] = useState<ConnectionCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stubTo, setStubTo] = useState('');
  const [stubMsg, setStubMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [channels, connections] = await Promise.all([
        api.listChannelsCatalog(),
        api.listConnectionsCatalog(),
      ]);
      setCatalog(channels.catalog);
      setConnCatalog(connections.catalog);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הערוצים נכשלה');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const gmailConnections = useMemo(
    () => workspaceConnections(connCatalog),
    [connCatalog],
  );

  async function configureEmail(connectionId: ConnectionId) {
    if (!canManage) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api.configureChannel('email', { connectionId, isPrimary: true });
      setInfo('ערוץ האימייל הוגדר');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הגדרת הערוץ נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runStubSend() {
    if (!canUse) return;
    setBusy(true);
    setStubMsg(null);
    try {
      const res = await api.stubEmailSend({
        to: stubTo,
        subject: 'בדיקה',
        body: 'stub',
      });
      setStubMsg(res.message);
    } catch (err) {
      setStubMsg(isApiError(err) ? err.message : 'שליחה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runStubList() {
    if (!canUse) return;
    setBusy(true);
    setStubMsg(null);
    try {
      const res = await api.stubEmailMessages();
      setStubMsg(
        res.message ??
          `תיבת דואר (stub): ${res.messages.length} הודעות — סנכרון Gmail בהמשך`,
      );
    } catch (err) {
      setStubMsg(isApiError(err) ? err.message : 'טעינה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">ערוצים</h2>
          <p className="text-sm text-muted-foreground">
            ערוצי תקשורת מול לקוחות ואנשי קשר. כל ערוץ יכול להתבסס על חיבור.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

        <ul className="divide-y rounded-lg border">
          {catalog.map((item) => {
            const connected = item.channel?.status === 'connected';
            const errored = item.channel?.status === 'error';
            const primary = item.channel?.bindings.find((b) => b.isPrimary);
            const isEmail = item.type === 'email';
            const available = item.status === 'available';

            return (
              <li key={item.type}>
                <div className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40">
                  <div className="group flex items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background p-1.5">
                      <ChannelIcon type={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {available ? (
                          <Badge variant="outline">זמין</Badge>
                        ) : (
                          <Badge variant="secondary">בקרוב</Badge>
                        )}
                        {connected ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            מחובר
                          </Badge>
                        ) : null}
                        {errored ? (
                          <Badge variant="destructive">שגיאה</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      {primary?.externalAccountName || primary?.provider ? (
                        <p
                          className="mt-1 text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          via {primary.externalAccountName ?? primary.provider}
                        </p>
                      ) : null}
                    </div>
                    {!isEmail ? (
                      <ArrowLeftIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : null}
                  </div>

                  {isEmail && available ? (
                    <div className="ms-14 flex flex-col gap-3 border-t pt-3">
                      {!connected && canManage ? (
                        gmailConnections.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            חברו Google Workspace תחת{' '}
                            <Link
                              className="underline"
                              href={ROUTES.workspaceIntegrationsConnections}
                            >
                              חיבורים
                            </Link>{' '}
                            ואז הגדירו את הערוץ כאן.
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {gmailConnections.map((c) => (
                              <Button
                                key={c.id}
                                size="sm"
                                disabled={busy}
                                onClick={() => void configureEmail(c.id)}
                              >
                                הגדר עם {c.externalAccountName ?? 'Gmail'}
                              </Button>
                            ))}
                          </div>
                        )
                      ) : null}

                      {connected ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">
                            שליחה וקריאה הן stubs — ללא קריאת Gmail עדיין.
                          </p>
                          <div className="flex flex-wrap items-end gap-2">
                            <Input
                              className="max-w-xs"
                              dir="ltr"
                              placeholder="to@example.com"
                              value={stubTo}
                              onChange={(e) => setStubTo(e.target.value)}
                              disabled={busy || !canUse}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy || !canUse}
                              onClick={() => void runStubSend()}
                            >
                              שלח (stub)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy || !canUse}
                              onClick={() => void runStubList()}
                            >
                              תיבה (stub)
                            </Button>
                          </div>
                          {stubMsg ? (
                            <p className="text-xs text-muted-foreground">
                              {stubMsg}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {!canManage ? (
          <p className="text-xs text-muted-foreground">
            נדרשת הרשאת ניהול חיבורים כדי להגדיר ערוצים.
          </p>
        ) : null}
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-lg bg-muted/50 p-4 text-sm">
        <p className="font-medium">מה ההבדל?</p>
        <p className="text-muted-foreground">
          <strong>חיבור</strong> הוא חשבון חיצוני (למשל Gmail).{' '}
          <strong>ערוץ</strong> הוא איך אתם מתקשרים עם לקוחות (למשל אימייל).
        </p>
        <Button variant="link" className="h-auto justify-start p-0" asChild>
          <Link href={ROUTES.workspaceIntegrationsConnections}>
            לניהול חיבורים
          </Link>
        </Button>
      </aside>
    </div>
  );
}
