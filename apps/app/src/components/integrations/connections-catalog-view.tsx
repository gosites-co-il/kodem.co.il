'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckIcon, PlusIcon, SearchIcon } from 'lucide-react';
import type {
  ConnectionCatalogItem,
  ConnectionPreviewResult,
  IntegrationId,
} from '@kodem/contracts';
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

function isActionFailure(
  value: unknown,
): value is { success: false; message?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: boolean }).success === false
  );
}

function isSheetsListResult(
  value: unknown,
): value is { spreadsheetId: string; title: string; sheets: Array<{ title: string }> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sheets' in value &&
    Array.isArray((value as { sheets: unknown }).sheets)
  );
}

function isPreviewResult(
  value: unknown,
): value is ConnectionPreviewResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'values' in value &&
    Array.isArray((value as { values: unknown }).values)
  );
}

function SheetsResourcePanel({
  connectionId,
  metadata,
  canManage,
  canUse,
  onBound,
}: {
  connectionId: string;
  metadata: Record<string, unknown> | null | undefined;
  canManage: boolean;
  canUse: boolean;
  onBound: () => Promise<void>;
}) {
  const boundId =
    typeof metadata?.['spreadsheetId'] === 'string'
      ? metadata['spreadsheetId']
      : null;
  const boundTitle =
    typeof metadata?.['spreadsheetTitle'] === 'string'
      ? metadata['spreadsheetTitle']
      : null;

  const [url, setUrl] = useState('');
  const [tabs, setTabs] = useState<string[]>([]);
  const [sheet, setSheet] = useState('');
  const [preview, setPreview] = useState<ConnectionPreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  const loadTabsAndPreview = useCallback(
    async (preferredSheet?: string) => {
      if (!canUse || !boundId) return;
      setLocalError(null);
      try {
        const sheetsRes = await api.listConnectionSheets(connectionId);
        if (isActionFailure(sheetsRes) || !isSheetsListResult(sheetsRes)) {
          setLocalError(
            isActionFailure(sheetsRes)
              ? (sheetsRes.message ?? 'טעינת הגיליונות נכשלה')
              : 'טעינת הגיליונות נכשלה',
          );
          return;
        }
        const titles = sheetsRes.sheets.map((s) => s.title);
        setTabs(titles);
        const nextSheet =
          preferredSheet && titles.includes(preferredSheet)
            ? preferredSheet
            : titles[0] ?? '';
        setSheet(nextSheet);
        if (!nextSheet) {
          setPreview(null);
          return;
        }
        const previewRes = await api.previewConnectionSheet(connectionId, {
          sheet: nextSheet,
        });
        if (isActionFailure(previewRes) || !isPreviewResult(previewRes)) {
          setLocalError(
            isActionFailure(previewRes)
              ? (previewRes.message ?? 'תצוגה מקדימה נכשלה')
              : 'תצוגה מקדימה נכשלה',
          );
          setPreview(null);
          return;
        }
        setPreview(previewRes);
      } catch (err) {
        setLocalError(isApiError(err) ? err.message : 'טעינת הנתונים נכשלה');
      }
    },
    [boundId, canUse, connectionId],
  );

  useEffect(() => {
    void loadTabsAndPreview();
  }, [loadTabsAndPreview]);

  async function bind() {
    if (!canManage || !url.trim()) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        spreadsheetUrl: url.trim(),
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת הגיליון נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'הגיליון נקשר');
      setUrl('');
      await onBound();
      const test = await api.testConnection(connectionId);
      if (test.message) setLocalInfo(test.message);
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת הגיליון נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function onSheetChange(next: string) {
    setSheet(next);
    if (!canUse || !next) return;
    setBusy(true);
    setLocalError(null);
    try {
      const previewRes = await api.previewConnectionSheet(connectionId, {
        sheet: next,
      });
      if (isActionFailure(previewRes) || !isPreviewResult(previewRes)) {
        setLocalError(
          isActionFailure(previewRes)
            ? (previewRes.message ?? 'תצוגה מקדימה נכשלה')
            : 'תצוגה מקדימה נכשלה',
        );
        setPreview(null);
        return;
      }
      setPreview(previewRes);
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'תצוגה מקדימה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t pt-3">
      <p className="text-xs text-muted-foreground">
        {boundTitle
          ? `קובץ: ${boundTitle}`
          : 'לא נבחר גיליון — הדביקו קישור לקובץ Sheets (כולל קבצים ששותפו איתכם)'}
      </p>
      {canManage ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            dir="ltr"
            className="font-mono text-xs"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !url.trim()}
            onClick={() => void bind()}
          >
            קשר קובץ
          </Button>
        </div>
      ) : null}
      {boundId && tabs.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">גיליון</span>
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={sheet}
            disabled={busy || !canUse}
            onChange={(e) => void onSheetChange(e.target.value)}
          >
            {tabs.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {localError ? (
        <p className="text-xs text-destructive">{localError}</p>
      ) : null}
      {localInfo ? (
        <p className="text-xs text-muted-foreground">{localInfo}</p>
      ) : null}
      {preview && preview.values.length > 0 ? (
        <div className="max-h-48 overflow-auto rounded-md border">
          <table className="w-full min-w-max border-collapse text-start text-xs">
            <tbody>
              {preview.values.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`max-w-[10rem] truncate border-e px-2 py-1 last:border-e-0 ${
                        ri === 0 ? 'bg-muted/50 font-medium' : ''
                      }`}
                      title={cell}
                    >
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function ConnectionsCatalogView() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const canManage = can(role, 'connections:manage');
  const canUse = can(role, 'connections:use');
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
          const sheetsConnection =
            item.integrationId === 'google_sheets' &&
            connected &&
            item.connection
              ? item.connection
              : null;
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
                {sheetsConnection ? (
                  <SheetsResourcePanel
                    connectionId={sheetsConnection.id}
                    metadata={sheetsConnection.metadata}
                    canManage={canManage}
                    canUse={canUse}
                    onBound={load}
                  />
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
