'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon, ChevronDownIcon, CircleCheckIcon, CircleXIcon, PlugZapIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import type {
  ConnectionCapability,
  ConnectionCatalogItem,
  ConnectionPreviewResult,
  IntegrationId,
  WorkspaceConnection,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kodem/design-system/components/ui/dropdown-menu';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@kodem/design-system/components/ui/sheet';
import {
  Status,
  type StatusVariant,
} from '@kodem/design-system/components/ui/status';
import { Switch } from '@kodem/design-system/components/ui/switch';
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
): value is {
  spreadsheetId: string;
  title: string;
  sheets: Array<{ title: string }>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sheets' in value &&
    Array.isArray((value as { sheets: unknown }).sheets)
  );
}

function isPreviewResult(value: unknown): value is ConnectionPreviewResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'values' in value &&
    Array.isArray((value as { values: unknown }).values)
  );
}

const SHEETS_FULL_CAPS: ConnectionCapability[] = [
  'sheets.read',
  'sheets.write',
];
const SHEETS_READONLY_CAPS: ConnectionCapability[] = ['sheets.read'];

const MULTI_CONNECT_IDS = new Set<string>([
  'google_sheets',
  'google_analytics',
  'google_business',
  'google_workspace',
]);

function statusLabel(status: WorkspaceConnection['status']): string {
  switch (status) {
    case 'connected':
    case 'inactive':
      // Credentials exist — inactive is soft-off, not disconnected.
      return 'מחובר';
    case 'expired':
      return 'פג תוקף';
    case 'error':
      return 'שגיאה';
    case 'disconnected':
      return 'מנותק';
    default:
      return status;
  }
}

function connectionStatusVariant(
  status: WorkspaceConnection['status'],
): StatusVariant {
  switch (status) {
    case 'connected':
    case 'inactive':
      return 'online';
    case 'expired':
      return 'degraded';
    case 'error':
      return 'error';
    case 'disconnected':
      return 'offline';
    default:
      return 'offline';
  }
}

function isLinkedConnection(c: WorkspaceConnection): boolean {
  return c.status === 'connected' || c.status === 'inactive';
}

function sheetsAccessLabel(
  capabilities: ConnectionCapability[] | undefined,
): string | null {
  if (!capabilities?.length) return null;
  if (capabilities.includes('sheets.write')) return 'חיבור מלא';
  if (capabilities.includes('sheets.read')) return 'קריאה בלבד';
  return null;
}

const KNOWN_INTEGRATION_IDS = new Set<string>([
  'google_workspace',
  'google_sheets',
  'microsoft_365',
  'google_analytics',
  'google_business',
  'meta',
  'google_ads',
  'whatsapp',
  'slack',
  'zoom',
]);

function isIntegrationId(value: string | undefined | null): value is IntegrationId {
  return Boolean(value && KNOWN_INTEGRATION_IDS.has(value));
}

function connectionsBasePath(pathname: string): string {
  return pathname.startsWith('/workspace/settings/connections')
    ? '/workspace/settings/connections'
    : '/workspace/integrations/connections';
}

function SheetsResourcePanel({
  connectionId,
  metadata,
  canManage,
  canUse,
  active,
  onBound,
}: {
  connectionId: string;
  metadata: Record<string, unknown> | null | undefined;
  canManage: boolean;
  canUse: boolean;
  /** Soft enablement — bind/preview require active. */
  active: boolean;
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
      if (!canUse || !active || !boundId) return;
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
            : (titles[0] ?? '');
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
    [active, boundId, canUse, connectionId],
  );

  useEffect(() => {
    void loadTabsAndPreview();
  }, [loadTabsAndPreview]);

  async function bind() {
    if (!canManage || !active || !url.trim()) return;
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
    if (!canUse || !active || !next) return;
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
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לקרוא ולכתוב בגיליון.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">קובץ</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {boundTitle
            ? boundTitle
            : 'לא נבחר גיליון — הדביקו קישור לקובץ Sheets (כולל קבצים ששותפו איתכם)'}
        </p>
      </div>
      {canManage ? (
        <div className="flex flex-col gap-2">
          <Input
            dir="ltr"
            className="font-mono text-xs"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy || !active}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !active || !url.trim()}
            onClick={() => void bind()}
          >
            קשר קובץ
          </Button>
        </div>
      ) : null}
      {boundId && tabs.length > 0 ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">גיליון</span>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={sheet}
            disabled={busy || !canUse || !active}
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
        <p className="text-sm text-destructive">{localError}</p>
      ) : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
      {active && preview && preview.values.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium">תצוגה מקדימה</h3>
          <div className="max-h-72 overflow-auto rounded-md border">
            <table className="w-full min-w-max border-collapse text-start text-xs">
              <tbody>
                {preview.values.map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`max-w-[10rem] truncate border-e px-2 py-1.5 last:border-e-0 ${
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
        </div>
      ) : null}
    </div>
  );
}

function AnalyticsResourcePanel({
  connectionId,
  metadata,
  canManage,
  canUse,
  active,
  onBound,
}: {
  connectionId: string;
  metadata: Record<string, unknown> | null | undefined;
  canManage: boolean;
  canUse: boolean;
  active: boolean;
  onBound: () => Promise<void>;
}) {
  const boundId =
    typeof metadata?.['propertyId'] === 'string' ? metadata['propertyId'] : null;
  const boundName =
    typeof metadata?.['propertyName'] === 'string'
      ? metadata['propertyName']
      : null;

  const [properties, setProperties] = useState<
    Array<{ propertyId: string; displayName: string; accountDisplayName?: string }>
  >([]);
  const [selected, setSelected] = useState(boundId ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!canUse || !active) return;
    let cancelled = false;
    void (async () => {
      setLocalError(null);
      try {
        const res = await api.listConnectionAnalyticsProperties(connectionId);
        if (isActionFailure(res) || !('properties' in res)) {
          if (!cancelled) {
            setLocalError(
              isActionFailure(res)
                ? (res.message ?? 'טעינת הנכסים נכשלה')
                : 'טעינת הנכסים נכשלה',
            );
          }
          return;
        }
        if (!cancelled) {
          setProperties(res.properties);
          setSelected((current) => current || res.properties[0]?.propertyId || '');
        }
      } catch (err) {
        if (!cancelled) {
          setLocalError(isApiError(err) ? err.message : 'טעינת הנכסים נכשלה');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, canUse, connectionId]);

  async function bind() {
    if (!canManage || !active || !selected) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        propertyId: selected,
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת הנכס נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'הנכס נקשר');
      await onBound();
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת הנכס נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור נכס Analytics.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">נכס GA4</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {boundName
            ? boundName
            : 'בחרו נכס Google Analytics 4 לקשר לחיבור'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selected}
            disabled={busy || properties.length === 0}
            onChange={(e) => setSelected(e.target.value)}
          >
            {properties.length === 0 ? (
              <option value="">אין נכסים זמינים</option>
            ) : (
              properties.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.accountDisplayName
                    ? `${p.displayName} (${p.accountDisplayName})`
                    : p.displayName}
                </option>
              ))
            )}
          </select>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !selected}
            onClick={() => void bind()}
          >
            קשר נכס
          </Button>
        </div>
      ) : null}
      {localError ? (
        <p className="text-sm text-destructive">{localError}</p>
      ) : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
    </div>
  );
}

function BusinessResourcePanel({
  connectionId,
  metadata,
  canManage,
  canUse,
  active,
  onBound,
}: {
  connectionId: string;
  metadata: Record<string, unknown> | null | undefined;
  canManage: boolean;
  canUse: boolean;
  active: boolean;
  onBound: () => Promise<void>;
}) {
  const boundName =
    typeof metadata?.['locationName'] === 'string'
      ? metadata['locationName']
      : null;
  const boundTitle =
    typeof metadata?.['locationTitle'] === 'string'
      ? metadata['locationTitle']
      : null;

  const [locations, setLocations] = useState<
    Array<{ locationName: string; title: string; accountName?: string }>
  >([]);
  const [selected, setSelected] = useState(boundName ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!canUse || !active) return;
    let cancelled = false;
    void (async () => {
      setLocalError(null);
      try {
        const res = await api.listConnectionBusinessLocations(connectionId);
        if (isActionFailure(res) || !('locations' in res)) {
          if (!cancelled) {
            setLocalError(
              isActionFailure(res)
                ? (res.message ?? 'טעינת המיקומים נכשלה')
                : 'טעינת המיקומים נכשלה',
            );
          }
          return;
        }
        if (!cancelled) {
          setLocations(res.locations);
          setSelected(
            (current) => current || res.locations[0]?.locationName || '',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setLocalError(isApiError(err) ? err.message : 'טעינת המיקומים נכשלה');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, canUse, connectionId]);

  async function bind() {
    if (!canManage || !active || !selected) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        locationName: selected,
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת המיקום נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'המיקום נקשר');
      await onBound();
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת המיקום נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור מיקום עסקי.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">מיקום</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {boundTitle
            ? boundTitle
            : 'בחרו מיקום Google Business Profile לקשר לחיבור'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selected}
            disabled={busy || locations.length === 0}
            onChange={(e) => setSelected(e.target.value)}
          >
            {locations.length === 0 ? (
              <option value="">אין מיקומים זמינים</option>
            ) : (
              locations.map((loc) => (
                <option key={loc.locationName} value={loc.locationName}>
                  {loc.accountName
                    ? `${loc.title} (${loc.accountName})`
                    : loc.title}
                </option>
              ))
            )}
          </select>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !selected}
            onClick={() => void bind()}
          >
            קשר מיקום
          </Button>
        </div>
      ) : null}
      {localError ? (
        <p className="text-sm text-destructive">{localError}</p>
      ) : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
    </div>
  );
}

function ConnectionDetailSheet({
  item,
  open,
  onOpenChange,
  activeConnectionId,
  onSelectConnection,
  canManage,
  canUse,
  busy,
  onBound,
  onDisconnect,
  onTest,
  onSetActive,
  testResult,
}: {
  item: ConnectionCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeConnectionId: string | null;
  onSelectConnection: (id: string) => void;
  canManage: boolean;
  canUse: boolean;
  busy: boolean;
  onBound: () => Promise<void>;
  onDisconnect: (connectionId: string) => void;
  onTest: (connectionId: string) => void;
  onSetActive: (connectionId: string, active: boolean) => void;
  testResult: { connectionId: string; message: string; ok: boolean } | null;
}) {
  const instances = item?.connections?.length
    ? item.connections
    : item?.connection
      ? [item.connection]
      : [];
  const connection =
    instances.find((c) => c.id === activeConnectionId) ?? instances[0] ?? null;
  const isSheets = item?.integrationId === 'google_sheets' && connection;
  const isAnalytics = item?.integrationId === 'google_analytics' && connection;
  const isBusiness = item?.integrationId === 'google_business' && connection;
  const isWorkspace = item?.integrationId === 'google_workspace' && connection;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {item && connection ? (
          <>
            <SheetHeader className="gap-3 border-b p-6 text-start">
              <div className="flex items-start gap-3 pe-8">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                  <IntegrationIcon id={item.integrationId} />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle>{item.name}</SheetTitle>
                  <SheetDescription>{item.description}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-6">
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  חיבורים ({instances.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {instances.map((c) => {
                    const title =
                      typeof c.metadata?.['spreadsheetTitle'] === 'string'
                        ? c.metadata['spreadsheetTitle']
                        : typeof c.metadata?.['propertyName'] === 'string'
                          ? c.metadata['propertyName']
                          : typeof c.metadata?.['locationTitle'] === 'string'
                            ? c.metadata['locationTitle']
                            : null;
                    const selected = c.id === connection.id;
                    const canToggle =
                      canManage &&
                      (c.status === 'connected' || c.status === 'inactive');
                    const isActive = c.active;
                    const permission =
                      item.integrationId === 'google_sheets'
                        ? sheetsAccessLabel(c.capabilities)
                        : null;
                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        className={`rounded-md border px-3 py-2.5 text-start text-sm transition-colors ${
                          selected
                            ? 'border-primary bg-accent'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => onSelectConnection(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectConnection(c.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {title ??
                                c.externalAccountName ??
                                c.id.slice(0, 12)}
                            </p>
                            {c.externalAccountName ? (
                              <p
                                className="mt-0.5 truncate text-xs text-muted-foreground"
                                dir="ltr"
                              >
                                {c.externalAccountName}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Status
                                status={connectionStatusVariant(c.status)}
                                label={statusLabel(c.status)}
                              />
                              {permission ? (
                                <Badge variant="outline">{permission}</Badge>
                              ) : null}
                            </div>
                            {canManage && isLinkedConnection(c) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="mt-2 h-7 gap-1 px-2 text-xs [&_svg]:size-3.5"
                                disabled={busy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTest(c.id);
                                }}
                              >
                                <PlugZapIcon data-icon="inline-start" />
                                בדוק חיבור
                              </Button>
                            ) : null}
                          </div>
                          <div
                            className="flex shrink-0 flex-col items-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`conn-active-${c.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                {isActive ? 'פעיל' : 'לא פעיל'}
                              </Label>
                              <Switch
                                id={`conn-active-${c.id}`}
                                checked={isActive}
                                disabled={!canToggle || busy}
                                onCheckedChange={(checked) =>
                                  onSetActive(c.id, checked)
                                }
                                aria-label={
                                  isActive ? 'השבת חיבור' : 'הפעל חיבור'
                                }
                              />
                            </div>
                            {!isActive && canManage ? (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={busy}
                                aria-label="מחק חיבור"
                                onClick={() => onDisconnect(c.id)}
                              >
                                <Trash2Icon />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {testResult?.connectionId === c.id ? (
                          <p
                            className={`mt-2 flex items-start gap-1.5 text-xs ${
                              testResult.ok
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive'
                            }`}
                            role="status"
                          >
                            {testResult.ok ? (
                              <CircleCheckIcon className="mt-0.5 size-3.5 shrink-0" />
                            ) : (
                              <CircleXIcon className="mt-0.5 size-3.5 shrink-0" />
                            )}
                            <span>{testResult.message}</span>
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              {isSheets ? (
                <SheetsResourcePanel
                  key={connection.id}
                  connectionId={connection.id}
                  metadata={connection.metadata}
                  canManage={canManage}
                  canUse={canUse}
                  active={connection.active}
                  onBound={onBound}
                />
              ) : isAnalytics ? (
                <AnalyticsResourcePanel
                  key={connection.id}
                  connectionId={connection.id}
                  metadata={connection.metadata}
                  canManage={canManage}
                  canUse={canUse}
                  active={connection.active}
                  onBound={onBound}
                />
              ) : isBusiness ? (
                <BusinessResourcePanel
                  key={connection.id}
                  connectionId={connection.id}
                  metadata={connection.metadata}
                  canManage={canManage}
                  canUse={canUse}
                  active={connection.active}
                  onBound={onBound}
                />
              ) : isWorkspace ? (
                <p className="text-sm text-muted-foreground">
                  חשבון Gmail מחובר. הגדירו את ערוץ האימייל תחת ערוצים. שליחה
                  וקריאה אמיתיות יתווספו בהמשך.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ניהול משאבים לחיבור זה יתווסף בהמשך.
                </p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function ConnectionsCatalogView() {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ integrationId?: string | string[] }>();
  const searchParams = useSearchParams();
  const basePath = connectionsBasePath(pathname);
  const routeParam = Array.isArray(params.integrationId)
    ? params.integrationId[0]
    : params.integrationId;
  const routeIntegrationId = isIntegrationId(routeParam) ? routeParam : null;
  const canManage = can(role, 'connections:manage');
  const canUse = can(role, 'connections:use');
  const [catalog, setCatalog] = useState<ConnectionCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(
    routeIntegrationId,
  );
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null,
  );
  const [testResult, setTestResult] = useState<{
    connectionId: string;
    message: string;
    ok: boolean;
  } | null>(null);

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
      if (isIntegrationId(connected)) {
        router.replace(`${basePath}/${connected}`);
      }
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
  }, [searchParams, load, router, basePath]);

  useEffect(() => {
    setSelectedId(routeIntegrationId);
    if (!routeIntegrationId) {
      setActiveConnectionId(null);
      setTestResult(null);
    }
  }, [routeIntegrationId]);

  useEffect(() => {
    if (!routeIntegrationId || catalog.length === 0) return;
    const item = catalog.find((c) => c.integrationId === routeIntegrationId);
    if (!item) {
      router.replace(basePath);
      return;
    }
    const instances = item.connections?.length
      ? item.connections
      : item.connection
        ? [item.connection]
        : [];
    if (instances.length === 0) {
      // Catalog card may still be opened after first connect loads.
      return;
    }
    setActiveConnectionId((current) => {
      if (current && instances.some((c) => c.id === current)) return current;
      return instances[0]!.id;
    });
  }, [routeIntegrationId, catalog, router, basePath]);

  const connectedCount = catalog.reduce((sum, c) => {
    const list = c.connections?.length
      ? c.connections
      : c.connection
        ? [c.connection]
        : [];
    return sum + list.filter(isLinkedConnection).length;
  }, 0);

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

  const selectedItem = useMemo(
    () => catalog.find((c) => c.integrationId === selectedId) ?? null,
    [catalog, selectedId],
  );

  const sheetOpen = Boolean(selectedItem && (selectedItem.connections?.length || selectedItem.connection));

  function instancesOf(item: ConnectionCatalogItem): WorkspaceConnection[] {
    if (item.connections?.length) return item.connections;
    return item.connection ? [item.connection] : [];
  }

  async function connect(
    integrationId: IntegrationId,
    capabilities?: ConnectionCapability[],
    accessMode?: 'full' | 'readonly',
  ) {
    if (!canManage) return;
    setBusyId(integrationId);
    setError(null);
    setInfo(null);
    try {
      const result = await api.connectIntegration(
        integrationId,
        capabilities || accessMode
          ? { capabilities, accessMode }
          : undefined,
      );
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
      setTestResult(null);
      const res = await api.listConnectionsCatalog();
      setCatalog(res.catalog);
      const current = res.catalog.find((c) => c.integrationId === selectedId);
      const remaining = current?.connections?.length
        ? current.connections
        : current?.connection
          ? [current.connection]
          : [];
      if (remaining.length === 0) {
        setSelectedId(null);
        setActiveConnectionId(null);
        router.push(basePath);
      } else {
        setActiveConnectionId(remaining[0]!.id);
      }
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת החיבור נכשלה');
    } finally {
      setBusyId(null);
    }
  }

  async function testConnection(connectionId: string) {
    setBusyId(connectionId);
    setTestResult(null);
    try {
      const result = await api.testConnection(connectionId);
      setTestResult({
        connectionId,
        ok: result.success,
        message:
          result.message ?? (result.success ? 'החיבור תקין' : 'בדיקה נכשלה'),
      });
    } catch (err) {
      setTestResult({
        connectionId,
        ok: false,
        message: isApiError(err) ? err.message : 'בדיקת החיבור נכשלה',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setConnectionActive(connectionId: string, active: boolean) {
    if (!canManage) return;
    setBusyId(connectionId);
    setError(null);
    try {
      const result = await api.setConnectionActive(connectionId, active);
      if (!result.success) {
        setError(result.message ?? 'עדכון הסטטוס נכשל');
        return;
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'עדכון הסטטוס נכשל');
    } finally {
      setBusyId(null);
    }
  }

  function openConnected(item: ConnectionCatalogItem, connectionId?: string) {
    const instances = instancesOf(item).filter(
      (c) =>
        c.status === 'connected' ||
        c.status === 'inactive' ||
        c.status === 'expired' ||
        c.status === 'error' ||
        c.status === 'disconnected',
    );
    if (!instances.length) return;
    setTestResult(null);
    setSelectedId(item.integrationId);
    setActiveConnectionId(connectionId ?? instances[0]!.id);
    router.push(`${basePath}/${item.integrationId}`);
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
          const instances = instancesOf(item);
          const linked = instances.filter(isLinkedConnection);
          const activeOnes = instances.filter((c) => c.active);
          const canOpen = instances.length > 0;
          const expired = instances.some((c) => c.status === 'expired');
          const errored = instances.some((c) => c.status === 'error');
          const showConnect =
            item.status === 'available' &&
            (MULTI_CONNECT_IDS.has(item.integrationId) || linked.length === 0);

          return (
            <Card
              key={item.integrationId}
              className={`flex flex-col transition-shadow hover:shadow-md ${
                canOpen ? 'cursor-pointer' : ''
              }`}
              onClick={() => {
                if (canOpen) openConnected(item);
              }}
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
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                {expired || errored ? (
                  <Badge variant="destructive">
                    {expired ? 'פג תוקף' : 'שגיאה'}
                  </Badge>
                ) : null}
                {linked.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {linked.length === 1
                      ? `${linked[0]?.externalAccountName ?? 'מחובר'}${
                          activeOnes.length === 0 ? ' · לא פעיל' : ''
                        }`
                      : `${linked.length} מחוברים${
                          activeOnes.length > 0
                            ? ` · ${activeOnes.length} פעילים`
                            : ' · לא פעילים'
                        }`}
                  </p>
                ) : null}
                {activeOnes.length === 1 ? (
                  typeof activeOnes[0]?.metadata?.['spreadsheetTitle'] ===
                  'string' ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      קובץ: {activeOnes[0].metadata['spreadsheetTitle']}
                    </p>
                  ) : typeof activeOnes[0]?.metadata?.['propertyName'] ===
                    'string' ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      נכס: {activeOnes[0].metadata['propertyName']}
                    </p>
                  ) : typeof activeOnes[0]?.metadata?.['locationTitle'] ===
                    'string' ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      מיקום: {activeOnes[0].metadata['locationTitle']}
                    </p>
                  ) : null
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  {item.category}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {canOpen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConnected(item);
                      }}
                    >
                      <CheckIcon data-icon="inline-start" />
                      {linked.length > 1 ? `${linked.length} מחוברים` : 'מחובר'}
                    </Button>
                  ) : null}
                  {showConnect && item.integrationId === 'google_sheets' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        disabled={!canManage || busyId === item.integrationId}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          disabled={!canManage || busyId === item.integrationId}
                        >
                          <PlusIcon data-icon="inline-start" />
                          {canOpen ? 'הוסף' : 'חבר'}
                          <ChevronDownIcon data-icon="inline-end" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-52" dir="rtl">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="items-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              void connect(
                                item.integrationId,
                                SHEETS_FULL_CAPS,
                                'full',
                              );
                            }}
                          >
                            <div className="flex w-full flex-col gap-0.5 text-start">
                              <span>חיבור מלא</span>
                              <span className="text-xs text-muted-foreground">
                                קריאה וכתיבה
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="items-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              void connect(
                                item.integrationId,
                                SHEETS_READONLY_CAPS,
                                'readonly',
                              );
                            }}
                          >
                            <div className="flex w-full flex-col gap-0.5 text-start">
                              <span>קריאה בלבד</span>
                              <span className="text-xs text-muted-foreground">
                                צפייה בגיליונות ללא שינוי
                              </span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  {showConnect && item.integrationId !== 'google_sheets' ? (
                    <Button
                      size="sm"
                      disabled={!canManage || busyId === item.integrationId}
                      onClick={(e) => {
                        e.stopPropagation();
                        void connect(item.integrationId);
                      }}
                    >
                      <PlusIcon data-icon="inline-start" />
                      חבר
                    </Button>
                  ) : null}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <ConnectionDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={(next) => {
          if (!next) {
            setSelectedId(null);
            setActiveConnectionId(null);
            setTestResult(null);
            if (routeIntegrationId) {
              router.push(basePath);
            }
          }
        }}
        activeConnectionId={activeConnectionId}
        onSelectConnection={(id) => {
          setActiveConnectionId(id);
          setTestResult(null);
        }}
        canManage={canManage}
        canUse={canUse}
        busy={busyId !== null}
        onBound={load}
        onDisconnect={(id) => void disconnect(id)}
        onTest={(id) => void testConnection(id)}
        onSetActive={(id, active) => void setConnectionActive(id, active)}
        testResult={testResult}
      />
    </div>
  );
}
