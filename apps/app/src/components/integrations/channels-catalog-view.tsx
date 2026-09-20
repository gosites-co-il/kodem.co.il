'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import type {
  ChannelCatalogItem,
  ChannelType,
  ConnectionCatalogItem,
  ConnectionId,
  EmailMessageItem,
  IntegrationId,
  MessagingMessageItem,
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

const CHANNEL_CONNECTION: Partial<Record<ChannelType, IntegrationId>> = {
  email: 'google_workspace',
  facebook_messenger: 'facebook',
  instagram: 'instagram',
  whatsapp: 'whatsapp',
};

const MESSAGING_TYPES = new Set<ChannelType>([
  'whatsapp',
  'instagram',
  'facebook_messenger',
]);

function connectionsForIntegration(
  catalog: ConnectionCatalogItem[],
  integrationId: IntegrationId,
): WorkspaceConnection[] {
  const out: WorkspaceConnection[] = [];
  for (const item of catalog) {
    if (item.integrationId !== integrationId) continue;
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
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<boolean | null>(null);
  const [emailMessages, setEmailMessages] = useState<EmailMessageItem[]>([]);
  const [msgMessages, setMsgMessages] = useState<MessagingMessageItem[]>([]);
  const [activeType, setActiveType] = useState<ChannelType | null>(null);

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
    () => connectionsForIntegration(connCatalog, 'google_workspace'),
    [connCatalog],
  );

  async function configureChannel(
    type: ChannelType,
    connectionId: ConnectionId,
  ) {
    if (!canManage) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api.configureChannel(type, { connectionId, isPrimary: true });
      setInfo('הערוץ הוגדר');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הגדרת הערוץ נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runEmailSend() {
    if (!canUse) return;
    setBusy(true);
    setActionMsg(null);
    setActionOk(null);
    setActiveType('email');
    try {
      const res = await api.sendEmail({
        to,
        subject: subject || 'הודעה מ-kodem',
        body: body || '',
      });
      setActionOk(res.success);
      setActionMsg(res.message ?? (res.success ? 'נשלח' : 'שליחה נכשלה'));
    } catch (err) {
      setActionOk(false);
      setActionMsg(isApiError(err) ? err.message : 'שליחה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runEmailList() {
    if (!canUse) return;
    setBusy(true);
    setActionMsg(null);
    setActionOk(null);
    setActiveType('email');
    try {
      const res = await api.listEmailMessages(15);
      setActionOk(res.success);
      setEmailMessages(res.messages);
      setMsgMessages([]);
      setActionMsg(
        res.message ??
          (res.success
            ? `נטענו ${res.messages.length} הודעות`
            : 'טעינת תיבת הדואר נכשלה'),
      );
    } catch (err) {
      setActionOk(false);
      setEmailMessages([]);
      setActionMsg(isApiError(err) ? err.message : 'טעינה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runMessagingSend(
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
  ) {
    if (!canUse) return;
    setBusy(true);
    setActionMsg(null);
    setActionOk(null);
    setActiveType(type);
    try {
      const res = await api.sendMessaging(type, { to, body: body || '' });
      setActionOk(res.success);
      setActionMsg(res.message ?? (res.success ? 'נשלח' : 'שליחה נכשלה'));
    } catch (err) {
      setActionOk(false);
      setActionMsg(isApiError(err) ? err.message : 'שליחה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runMessagingList(
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
  ) {
    if (!canUse) return;
    setBusy(true);
    setActionMsg(null);
    setActionOk(null);
    setActiveType(type);
    try {
      const res = await api.listMessaging(type, 15);
      setActionOk(res.success);
      setMsgMessages(res.messages);
      setEmailMessages([]);
      setActionMsg(
        res.message ??
          (res.success
            ? `נטענו ${res.messages.length} הודעות`
            : 'טעינת הודעות נכשלה'),
      );
    } catch (err) {
      setActionOk(false);
      setMsgMessages([]);
      setActionMsg(isApiError(err) ? err.message : 'טעינה נכשלה');
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
            const isMessaging = MESSAGING_TYPES.has(item.type);
            const available = item.status === 'available';
            const integrationId = CHANNEL_CONNECTION[item.type];
            const eligible = integrationId
              ? connectionsForIntegration(connCatalog, integrationId)
              : [];
            const showPanel = available && (isEmail || isMessaging);

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
                    {!showPanel ? (
                      <ArrowLeftIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : null}
                  </div>

                  {showPanel ? (
                    <div className="ms-14 flex flex-col gap-3 border-t pt-3">
                      {!connected && canManage ? (
                        eligible.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            חברו את החיבור המתאים תחת{' '}
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
                            {eligible.map((c) => (
                              <Button
                                key={c.id}
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  void configureChannel(item.type, c.id)
                                }
                              >
                                הגדר עם{' '}
                                {c.externalAccountName ?? c.integrationId}
                              </Button>
                            ))}
                          </div>
                        )
                      ) : null}

                      {connected ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2 sm:max-w-md">
                            <Input
                              dir="ltr"
                              placeholder={
                                isEmail
                                  ? 'to@example.com'
                                  : item.type === 'whatsapp'
                                    ? '9725...'
                                    : 'PSID / IGSID'
                              }
                              value={activeType === item.type ? to : to}
                              onChange={(e) => setTo(e.target.value)}
                              disabled={busy || !canUse}
                            />
                            {isEmail ? (
                              <Input
                                placeholder="נושא"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={busy || !canUse}
                              />
                            ) : null}
                            <textarea
                              className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="תוכן ההודעה"
                              value={body}
                              onChange={(e) => setBody(e.target.value)}
                              disabled={busy || !canUse}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={
                                  busy ||
                                  !canUse ||
                                  !to.trim() ||
                                  (!isEmail && !body.trim())
                                }
                                onClick={() =>
                                  void (isEmail
                                    ? runEmailSend()
                                    : runMessagingSend(
                                        item.type as
                                          | 'whatsapp'
                                          | 'instagram'
                                          | 'facebook_messenger',
                                      ))
                                }
                              >
                                שלח
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || !canUse}
                                onClick={() =>
                                  void (isEmail
                                    ? runEmailList()
                                    : runMessagingList(
                                        item.type as
                                          | 'whatsapp'
                                          | 'instagram'
                                          | 'facebook_messenger',
                                      ))
                                }
                              >
                                טען תיבה
                              </Button>
                            </div>
                          </div>
                          {actionMsg && activeType === item.type ? (
                            <p
                              className={`text-xs ${
                                actionOk === false
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {actionMsg}
                            </p>
                          ) : null}
                          {activeType === 'email' &&
                          item.type === 'email' &&
                          emailMessages.length > 0 ? (
                            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2 text-xs">
                              {emailMessages.map((m) => (
                                <li
                                  key={m.id}
                                  className="border-b pb-2 last:border-0 last:pb-0"
                                >
                                  <p className="font-medium">
                                    {m.subject || '(ללא נושא)'}
                                  </p>
                                  <p
                                    className="text-muted-foreground"
                                    dir="ltr"
                                  >
                                    {m.from}
                                    {m.date ? ` · ${m.date}` : ''}
                                  </p>
                                  {m.snippet ? (
                                    <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                                      {m.snippet}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {activeType === item.type &&
                          isMessaging &&
                          msgMessages.length > 0 ? (
                            <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2 text-xs">
                              {msgMessages.map((m) => (
                                <li
                                  key={m.id}
                                  className="border-b pb-2 last:border-0 last:pb-0"
                                >
                                  <p className="font-medium" dir="auto">
                                    {m.body || '(ללא תוכן)'}
                                  </p>
                                  <p
                                    className="text-muted-foreground"
                                    dir="ltr"
                                  >
                                    {m.from}
                                    {m.timestamp ? ` · ${m.timestamp}` : ''}
                                  </p>
                                </li>
                              ))}
                            </ul>
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
          <strong>חיבור</strong> הוא חשבון חיצוני (למשל Facebook / WhatsApp).{' '}
          <strong>ערוץ</strong> הוא איך אתם מתקשרים עם לקוחות.
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
