'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CheckIcon, ChevronDownIcon, CircleCheckIcon, CircleXIcon, PlugZapIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import type {
  ConnectionCapability,
  ConnectionCatalogItem,
  ConnectionPreviewResult,
  ImportContactsFromSheetsResult,
  IntegrationId,
  SheetsContactImportField,
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
import { WhatsAppSignupWizard } from './whatsapp-signup-wizard';

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

const IMPORT_FIELD_OPTIONS: Array<{
  value: SheetsContactImportField;
  label: string;
}> = [
  { value: 'skip', label: 'דילוג' },
  { value: 'name', label: 'שם' },
  { value: 'email', label: 'אימייל' },
  { value: 'phone', label: 'טלפון' },
  { value: 'notes', label: 'הערות' },
];

function suggestContactField(header: string): SheetsContactImportField {
  const h = header.trim().toLowerCase();
  if (!h) return 'skip';
  if (
    /^(name|full.?name|contact)$/i.test(h) ||
    h === 'שם' ||
    h === 'שם מלא' ||
    h === 'שם הלקוח' ||
    h.includes('שם')
  ) {
    return 'name';
  }
  if (
    /^(e-?mail|mail)$/i.test(h) ||
    h === 'אימייל' ||
    h === 'מייל' ||
    h.includes('mail')
  ) {
    return 'email';
  }
  if (
    /^(phone|mobile|tel|cellphone)$/i.test(h) ||
    h === 'טלפון' ||
    h === 'נייד' ||
    h === 'פלאפון' ||
    h.includes('טלפון') ||
    h.includes('נייד')
  ) {
    return 'phone';
  }
  if (
    /^(notes?|comment)$/i.test(h) ||
    h === 'הערות' ||
    h === 'הערה' ||
    h.includes('הער')
  ) {
    return 'notes';
  }
  return 'skip';
}

function buildSuggestedMapping(
  headers: string[],
): Record<string, SheetsContactImportField> {
  const mapping: Record<string, SheetsContactImportField> = {};
  const used = new Set<SheetsContactImportField>();
  for (const header of headers) {
    const key = header.trim();
    if (!key) continue;
    const field = suggestContactField(key);
    if (field !== 'skip' && used.has(field)) {
      mapping[key] = 'skip';
      continue;
    }
    mapping[key] = field;
    if (field !== 'skip') used.add(field);
  }
  return mapping;
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
  'facebook',
  'instagram',
  'whatsapp',
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
  'facebook',
  'instagram',
  'whatsapp',
  'meta',
  'google_ads',
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

function routeIntegrationFromPath(pathname: string): IntegrationId | null {
  const base = connectionsBasePath(pathname);
  if (pathname === base) return null;
  if (!pathname.startsWith(`${base}/`)) return null;
  const segment = pathname.slice(base.length + 1).split('/')[0];
  return isIntegrationId(segment) ? segment : null;
}

/** Update the URL without a Next.js soft navigation (avoids remount/flicker). */
function shallowSetPath(path: string, mode: 'push' | 'replace' = 'push') {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;
  if (mode === 'replace') {
    window.history.replaceState(window.history.state, '', path);
  } else {
    window.history.pushState(window.history.state, '', path);
  }
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
  const [mapping, setMapping] = useState<
    Record<string, SheetsContactImportField>
  >({});
  const [importResult, setImportResult] =
    useState<ImportContactsFromSheetsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  const previewHeaders = useMemo(() => {
    if (!preview?.values?.[0]) return [];
    return preview.values[0]
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
  }, [preview]);

  const applyPreview = useCallback((previewRes: ConnectionPreviewResult) => {
    setPreview(previewRes);
    setImportResult(null);
    const headers = (previewRes.values[0] ?? [])
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    setMapping(buildSuggestedMapping(headers));
  }, []);

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
        applyPreview(previewRes);
      } catch (err) {
        setLocalError(isApiError(err) ? err.message : 'טעינת הנתונים נכשלה');
      }
    },
    [active, applyPreview, boundId, canUse, connectionId],
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
      applyPreview(previewRes);
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'תצוגה מקדימה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!canUse || !active || !sheet) return;
    const hasName = Object.values(mapping).includes('name');
    if (!hasName) {
      setLocalError('יש למפות לפחות עמודה אחת לשדה שם');
      return;
    }
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    setImportResult(null);
    try {
      const result = await api.importContactsFromSheets(connectionId, {
        sheet,
        mapping,
      });
      setImportResult(result);
      if (result.success) {
        setLocalInfo(result.message ?? null);
      } else {
        setLocalError(result.message ?? 'ייבוא אנשי הקשר נכשל');
      }
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'ייבוא אנשי הקשר נכשל');
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
        <div className="flex flex-col gap-4">
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

          {canUse && previewHeaders.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-medium">ייבוא לאנשי קשר</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  התאימו עמודות לשדות CRM וייבאו עד 500 שורות (ללא כפילויות /
                  עדכון).
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {previewHeaders.map((header) => (
                  <li
                    key={header}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span
                      className="min-w-24 max-w-[10rem] truncate font-medium"
                      title={header}
                      dir="auto"
                    >
                      {header}
                    </span>
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      value={mapping[header] ?? 'skip'}
                      disabled={busy}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [header]: e.target
                            .value as SheetsContactImportField,
                        }))
                      }
                    >
                      {IMPORT_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={
                    busy ||
                    !active ||
                    !Object.values(mapping).includes('name')
                  }
                  onClick={() => void runImport()}
                >
                  ייבא לאנשי קשר
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    setMapping(buildSuggestedMapping(previewHeaders))
                  }
                >
                  הצעה אוטומטית
                </Button>
              </div>
              {importResult?.success ? (
                <div className="text-xs text-muted-foreground">
                  <p>
                    נוצרו {importResult.created} · דולגו {importResult.skipped}
                    {importResult.errors.length
                      ? ` · שגיאות ${importResult.errors.length}`
                      : ''}
                  </p>
                  {importResult.errors.length > 0 ? (
                    <ul className="mt-1 max-h-24 overflow-y-auto">
                      {importResult.errors.map((e) => (
                        <li key={`${e.row}-${e.message}`}>
                          שורה {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
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
  const [manualName, setManualName] = useState(boundName ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);
  const [listFailed, setListFailed] = useState(false);

  useEffect(() => {
    if (!canUse || !active) return;
    let cancelled = false;
    void (async () => {
      setLocalError(null);
      setListFailed(false);
      try {
        const res = await api.listConnectionBusinessLocations(connectionId);
        if (isActionFailure(res) || !('locations' in res)) {
          if (!cancelled) {
            setListFailed(true);
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
          setListFailed(true);
          setLocalError(isApiError(err) ? err.message : 'טעינת המיקומים נכשלה');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, canUse, connectionId]);

  async function bind(locationName: string) {
    if (!canManage || !active || !locationName.trim()) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        locationName: locationName.trim(),
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
            : 'בחרו מיקום מהרשימה או הדביקו מזהה מיקום (locations/… )'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          {!listFailed && locations.length > 0 ? (
            <>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={selected}
                disabled={busy}
                onChange={(e) => setSelected(e.target.value)}
              >
                {locations.map((loc) => (
                  <option key={loc.locationName} value={loc.locationName}>
                    {loc.accountName
                      ? `${loc.title} (${loc.accountName})`
                      : loc.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || !selected}
                onClick={() => void bind(selected)}
              >
                קשר מיקום
              </Button>
            </>
          ) : null}
          <Input
            dir="ltr"
            className="font-mono text-xs"
            placeholder="locations/1234567890 או accounts/…/locations/…"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            disabled={busy}
          />
          <Button
            size="sm"
            variant={listFailed || locations.length === 0 ? 'secondary' : 'outline'}
            disabled={busy || !manualName.trim()}
            onClick={() => void bind(manualName)}
          >
            קשר לפי מזהה
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

function FacebookResourcePanel({
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
    typeof metadata?.['pageId'] === 'string' ? metadata['pageId'] : null;
  const boundName =
    typeof metadata?.['pageName'] === 'string' ? metadata['pageName'] : null;

  const [pages, setPages] = useState<Array<{ pageId: string; name: string }>>(
    [],
  );
  const [selected, setSelected] = useState(boundId ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUse || !active) return;
    setLocalError(null);
    try {
      const res = await api.listConnectionFacebookPages(connectionId);
      if (isActionFailure(res) || !('pages' in res)) {
        setLocalError(
          isActionFailure(res) ? (res.message ?? 'טעינת הדפים נכשלה') : 'טעינת הדפים נכשלה',
        );
        return;
      }
      setPages(res.pages);
      if (!selected && res.pages[0]) setSelected(res.pages[0].pageId);
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'טעינת הדפים נכשלה');
    }
  }, [active, canUse, connectionId, selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function bind() {
    if (!canManage || !active || !selected) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        pageId: selected,
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת הדף נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'הדף נקשר');
      await onBound();
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת הדף נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור דף.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">דף Facebook</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {boundName ?? boundId ?? 'בחרו דף לקשר לחיבור (Messenger)'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selected}
            disabled={busy || pages.length === 0}
            onChange={(e) => setSelected(e.target.value)}
          >
            {pages.length === 0 ? (
              <option value="">אין דפים זמינים</option>
            ) : (
              pages.map((p) => (
                <option key={p.pageId} value={p.pageId}>
                  {p.name}
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
            קשר דף
          </Button>
        </div>
      ) : null}
      {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
    </div>
  );
}

function InstagramResourcePanel({
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
    typeof metadata?.['igUserId'] === 'string' ? metadata['igUserId'] : null;
  const boundName =
    typeof metadata?.['igUsername'] === 'string'
      ? metadata['igUsername']
      : null;

  const [accounts, setAccounts] = useState<
    Array<{ igUserId: string; username: string; pageName?: string }>
  >([]);
  const [selected, setSelected] = useState(boundId ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canUse || !active) return;
    setLocalError(null);
    try {
      const res = await api.listConnectionInstagramAccounts(connectionId);
      if (isActionFailure(res) || !('accounts' in res)) {
        setLocalError(
          isActionFailure(res)
            ? (res.message ?? 'טעינת חשבונות נכשלה')
            : 'טעינת חשבונות נכשלה',
        );
        return;
      }
      setAccounts(res.accounts);
      if (!selected && res.accounts[0]) setSelected(res.accounts[0].igUserId);
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'טעינת חשבונות נכשלה');
    }
  }, [active, canUse, connectionId, selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function bind() {
    if (!canManage || !active || !selected) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        igUserId: selected,
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת החשבון נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'החשבון נקשר');
      await onBound();
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת החשבון נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור חשבון.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">חשבון Instagram</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {boundName ? `@${boundName}` : boundId ?? 'בחרו חשבון עסקי לקשר'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selected}
            disabled={busy || accounts.length === 0}
            onChange={(e) => setSelected(e.target.value)}
          >
            {accounts.length === 0 ? (
              <option value="">אין חשבונות זמינים</option>
            ) : (
              accounts.map((a) => (
                <option key={a.igUserId} value={a.igUserId}>
                  @{a.username}
                  {a.pageName ? ` (${a.pageName})` : ''}
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
            קשר חשבון
          </Button>
        </div>
      ) : null}
      {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
    </div>
  );
}

function WhatsAppResourcePanel({
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
    typeof metadata?.['phoneNumberId'] === 'string'
      ? metadata['phoneNumberId']
      : null;
  const boundDisplay =
    typeof metadata?.['displayPhoneNumber'] === 'string'
      ? metadata['displayPhoneNumber']
      : null;

  const [phones, setPhones] = useState<
    Array<{
      phoneNumberId: string;
      displayPhoneNumber: string;
      wabaId?: string;
    }>
  >([]);
  const [selected, setSelected] = useState(boundId ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  const load = useCallback(async () => {
    if (!canUse || !active) return;
    setLocalError(null);
    try {
      const res = await api.listConnectionWhatsAppPhoneNumbers(connectionId);
      if (isActionFailure(res) || !('phoneNumbers' in res)) {
        setLocalError(
          isActionFailure(res)
            ? (res.message ?? 'טעינת המספרים נכשלה')
            : 'טעינת המספרים נכשלה',
        );
        setShowSignup(true);
        return;
      }
      setPhones(res.phoneNumbers);
      setShowSignup(res.phoneNumbers.length === 0 && !boundId);
      if (!selected && res.phoneNumbers[0]) {
        setSelected(res.phoneNumbers[0].phoneNumberId);
      }
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'טעינת המספרים נכשלה');
      setShowSignup(true);
    }
  }, [active, boundId, canUse, connectionId, selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function bind() {
    if (!canManage || !active || !selected) return;
    const phone = phones.find((p) => p.phoneNumberId === selected);
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const result = await api.bindConnectionResource(connectionId, {
        phoneNumberId: selected,
        wabaId: phone?.wabaId,
      });
      if (!result.success) {
        setLocalError(result.message ?? 'קשירת המספר נכשלה');
        return;
      }
      setLocalInfo(result.message ?? 'המספר נקשר');
      await onBound();
    } catch (err) {
      setLocalError(isApiError(err) ? err.message : 'קשירת המספר נכשלה');
    } finally {
      setBusy(false);
    }
  }

  if (showSignup || (!boundId && phones.length === 0 && active)) {
    return (
      <div className="flex flex-col gap-4">
        {!active ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור מספר.
          </p>
        ) : null}
        <WhatsAppSignupWizard
          connectionId={connectionId}
          canManage={canManage && active}
          onComplete={onBound}
        />
        {phones.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowSignup(false)}
          >
            בחרו מספר קיים מהרשימה
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!active ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          החיבור מחובר אך לא פעיל — הפעילו אותו כדי לבחור מספר.
        </p>
      ) : null}
      <div>
        <h3 className="text-sm font-medium">מספר WhatsApp</h3>
        <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
          {boundDisplay ?? boundId ?? 'בחרו מספר Cloud API לקשר'}
        </p>
      </div>
      {canManage && active ? (
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selected}
            disabled={busy || phones.length === 0}
            onChange={(e) => setSelected(e.target.value)}
            dir="ltr"
          >
            {phones.length === 0 ? (
              <option value="">אין מספרים זמינים</option>
            ) : (
              phones.map((p) => (
                <option key={p.phoneNumberId} value={p.phoneNumberId}>
                  {p.displayPhoneNumber}
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
            קשר מספר
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setShowSignup(true)}
          >
            חבר מספר חדש דרך Meta
          </Button>
        </div>
      ) : null}
      {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
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
  const isFacebook = item?.integrationId === 'facebook' && connection;
  const isInstagram = item?.integrationId === 'instagram' && connection;
  const isWhatsApp = item?.integrationId === 'whatsapp' && connection;
  const isWhatsAppSignup =
    item?.integrationId === 'whatsapp' && !connection;

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
              ) : isFacebook ? (
                <FacebookResourcePanel
                  key={connection.id}
                  connectionId={connection.id}
                  metadata={connection.metadata}
                  canManage={canManage}
                  canUse={canUse}
                  active={connection.active}
                  onBound={onBound}
                />
              ) : isInstagram ? (
                <InstagramResourcePanel
                  key={connection.id}
                  connectionId={connection.id}
                  metadata={connection.metadata}
                  canManage={canManage}
                  canUse={canUse}
                  active={connection.active}
                  onBound={onBound}
                />
              ) : isWhatsApp ? (
                <WhatsAppResourcePanel
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
                  חשבון Gmail מחובר. הגדירו את ערוץ האימייל תחת ערוצים לשליחה
                  וקריאה דרך Gmail.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ניהול משאבים לחיבור זה יתווסף בהמשך.
                </p>
              )}
            </div>
          </>
        ) : item && isWhatsAppSignup ? (
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
              <WhatsAppSignupWizard
                canManage={canManage}
                onComplete={onBound}
              />
            </div>
          </>
        ) : item ? (
          <SheetHeader className="gap-3 p-6 text-start">
            <div className="flex items-start gap-3 pe-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                <IntegrationIcon id={item.integrationId} />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle>{item.name}</SheetTitle>
                <SheetDescription>
                  אין חיבורים פעילים לניהול עדיין.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        ) : (
          <SheetHeader className="gap-3 p-6 text-start">
            <SheetTitle>טוען חיבור…</SheetTitle>
            <SheetDescription>פרטי החיבור נטענים.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Isolated so useSearchParams Suspense does not remount the catalog. */
function ConnectionOAuthQueryEffects({
  basePath,
  onConnected,
  onError,
}: {
  basePath: string;
  onConnected: (integrationId: string) => void;
  onError: (message: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (connected) {
      onConnected(connected);
      if (isIntegrationId(connected)) {
        shallowSetPath(`${basePath}/${connected}`, 'replace');
      } else {
        shallowSetPath(basePath, 'replace');
      }
    } else if (oauthError) {
      const redirectUri =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('kodem.oauth.redirectUri')
          : null;
      onError(
        redirectUri
          ? `חיבור נכשל (${oauthError}). ודאו שב-Google Cloud Console מופיעה בדיוק הכתובת: ${redirectUri}`
          : `חיבור נכשל: ${oauthError}`,
      );
    }
  }, [searchParams, onConnected, onError, basePath]);

  return null;
}

export function ConnectionsCatalogView() {
  const { role } = useAuth();
  const pathname = usePathname();
  const basePath = connectionsBasePath(pathname);
  const canManage = can(role, 'connections:manage');
  const canUse = can(role, 'connections:use');
  const [catalog, setCatalog] = useState<ConnectionCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(() =>
    routeIntegrationFromPath(pathname),
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

  const handleOAuthConnected = useCallback(
    (integrationId: string) => {
      setInfo(`חובר בהצלחה: ${integrationId}`);
      if (isIntegrationId(integrationId)) {
        setSelectedId(integrationId);
      }
      void load();
    },
    [load],
  );

  const handleOAuthError = useCallback((message: string) => {
    setError(message);
  }, []);

  useEffect(() => {
    function onPopState() {
      const id = routeIntegrationFromPath(window.location.pathname);
      setSelectedId(id);
      if (!id) {
        setActiveConnectionId(null);
        setTestResult(null);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!selectedId || catalog.length === 0) return;
    const item = catalog.find((c) => c.integrationId === selectedId);
    if (!item) {
      setSelectedId(null);
      setActiveConnectionId(null);
      shallowSetPath(basePath, 'replace');
      return;
    }
    const instances = item.connections?.length
      ? item.connections
      : item.connection
        ? [item.connection]
        : [];
    if (instances.length === 0) {
      return;
    }
    setActiveConnectionId((current) => {
      if (current && instances.some((c) => c.id === current)) return current;
      return instances[0]!.id;
    });
  }, [selectedId, catalog, basePath]);

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

  // Keep sheet open from selection/route — do not wait for catalog instances
  // (avoids close→reopen flicker while catalog loads or remounts).
  const sheetOpen = selectedId !== null;

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
        shallowSetPath(basePath, 'replace');
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

  function openWhatsAppSignup() {
    setTestResult(null);
    setSelectedId('whatsapp');
    setActiveConnectionId(null);
    shallowSetPath(`${basePath}/whatsapp`, 'push');
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
    shallowSetPath(`${basePath}/${item.integrationId}`, 'push');
  }

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <ConnectionOAuthQueryEffects
          basePath={basePath}
          onConnected={handleOAuthConnected}
          onError={handleOAuthError}
        />
      </Suspense>
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
          const cardInteractive = canOpen || showConnect;

          return (
            <Card
              key={item.integrationId}
              className={`flex flex-col transition-shadow hover:shadow-md ${
                cardInteractive ? 'cursor-pointer' : ''
              }`}
              onClick={() => {
                if (canOpen) {
                  openConnected(item);
                  return;
                }
                if (
                  showConnect &&
                  canManage &&
                  item.integrationId === 'whatsapp'
                ) {
                  openWhatsAppSignup();
                  return;
                }
                // Sheets needs access-mode dropdown — use חבר button.
                if (
                  showConnect &&
                  canManage &&
                  item.integrationId !== 'google_sheets'
                ) {
                  void connect(item.integrationId);
                }
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
                  {showConnect && item.integrationId === 'whatsapp' ? (
                    <Button
                      size="sm"
                      disabled={!canManage || busyId === item.integrationId}
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsAppSignup();
                      }}
                    >
                      <PlusIcon data-icon="inline-start" />
                      {canOpen ? 'הוסף' : 'חבר'}
                    </Button>
                  ) : null}
                  {showConnect &&
                  item.integrationId !== 'google_sheets' &&
                  item.integrationId !== 'whatsapp' ? (
                    <Button
                      size="sm"
                      disabled={!canManage || busyId === item.integrationId}
                      onClick={(e) => {
                        e.stopPropagation();
                        void connect(item.integrationId);
                      }}
                    >
                      <PlusIcon data-icon="inline-start" />
                      {canOpen ? 'הוסף' : 'חבר'}
                    </Button>
                  ) : null}
                  {!showConnect && !canOpen && item.status !== 'available' ? (
                    <Badge variant="secondary">בקרוב</Badge>
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
            shallowSetPath(basePath, 'push');
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
