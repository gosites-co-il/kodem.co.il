'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckIcon, PlusIcon, SearchIcon } from 'lucide-react';
import type { ConnectionCatalogItem, IntegrationId } from '@kodem/contracts';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Input } from '@kodem/design-system/components/ui/input';
import { api, isApiError } from '../../lib/api';
import { can } from '../../lib/auth/permissions';
import { useAuth } from '../../providers/auth-provider';
import { IntegrationIcon } from './integration-icons';

export function ConnectionsCatalogView() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const canManage = can(role, 'connections:manage');
  const [catalog, setCatalog] = useState<ConnectionCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listConnectionsCatalog();
      setCatalog(res.catalog);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת החיבורים נכשלה');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (connected) {
      setInfo(`חובר בהצלחה: ${connected}`);
      void load();
    } else if (oauthError) {
      const redirectUri =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('kodem.oauth.redirectUri')
          : null;
      setError(
        redirectUri
          ? `חיבור נכשל (${oauthError}). ודאו שב-Google Cloud Console מופיעה בדיוק הכתובת: ${redirectUri}`
          : `חיבור נכשל: ${oauthError}`,
      );
    }
  }, [searchParams, load]);

  const connectedCount = catalog.filter(
    (c) => c.connection?.status === 'connected',
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  async function connect(integrationId: IntegrationId) {
    if (!canManage) return;
    setBusyId(integrationId);
    setError(null);
    setInfo(null);
    try {
      const result = await api.connectIntegration(integrationId);
      if (result.code === 'oauth_redirect' && result.authorizeUrl) {
        if (result.redirectUri) {
          sessionStorage.setItem(
            'kodem.oauth.redirectUri',
            result.redirectUri,
          );
          // Helps debug redirect_uri_mismatch — copy this exact URI into Google Console.
          console.info(
            '[kodem] Google OAuth redirect_uri (must match Cloud Console exactly):',
            result.redirectUri,
          );
        }
        window.location.assign(result.authorizeUrl);
        return;
      }
      if (!result.success) {
        setInfo(result.message ?? 'החיבור עדיין לא זמין');
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'החיבור נכשל');
    } finally {
      setBusyId(null);
    }
  }

  async function disconnect(connectionId: string) {
    if (!canManage) return;
    setBusyId(connectionId);
    setError(null);
    try {
      await api.disconnectConnection(connectionId);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'ניתוק החיבור נכשל');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">חיבורים</h2>
          <p className="text-sm text-muted-foreground">
            חברו כלים חיצוניים לסביבת העבודה. {connectedCount} מחוברים.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder="חיפוש חיבורים…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const connected = item.connection?.status === 'connected';
          const expired = item.connection?.status === 'expired';
          const errored = item.connection?.status === 'error';
          return (
            <Card
              key={item.integrationId}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                  <IntegrationIcon id={item.integrationId} />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                  {connected && item.capabilities.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.capabilities.slice(0, 4).join(' · ')}
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                {expired || errored ? (
                  <Badge variant="destructive">
                    {expired ? 'פג תוקף' : 'שגיאה'}
                  </Badge>
                ) : null}
                {item.connection?.externalAccountName ? (
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {item.connection.externalAccountName}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  {item.category}
                </span>
                {connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canManage || busyId === item.connection?.id}
                    onClick={() =>
                      item.connection && void disconnect(item.connection.id)
                    }
                  >
                    <CheckIcon data-icon="inline-start" />
                    מחובר
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={!canManage || busyId === item.integrationId}
                    onClick={() => void connect(item.integrationId)}
                  >
                    <PlusIcon data-icon="inline-start" />
                    חבר
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
