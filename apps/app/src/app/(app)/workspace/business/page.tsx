'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { BusinessRecordView } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { api, isApiError } from '../../../../lib/api';
import { ROUTES } from '../../../../lib/constants';
import { BusinessSections } from '../../../../components/business/business-sections';

function updatedJustNow(syncedAt?: string): boolean {
  if (!syncedAt) return false;
  const at = new Date(syncedAt).getTime();
  return Number.isFinite(at) && Date.now() - at < 2 * 60 * 1000;
}

function statusLabel(record: BusinessRecordView, syncing: boolean): string {
  if (syncing) return 'מסנכרן';
  if (record.crawling) return 'אוספים נתונים מהאתר';
  if (record.syncMessage) return record.syncMessage;
  if (record.syncStatus === 'success' && updatedJustNow(record.syncedAt)) return 'עודכן עכשיו';
  return '';
}

export default function BusinessProfilePage() {
  const [record, setRecord] = useState<BusinessRecordView | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await api.getBusinessRecord();
      setRecord(next);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא הצלחנו לטעון את הפרופיל.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!record?.crawling) return;
    const timer = setInterval(() => {
      void load();
    }, 2000);
    return () => clearInterval(timer);
  }, [record?.crawling, load]);

  async function refresh() {
    setSyncing(true);
    setError(null);
    try {
      const next = await api.refreshBusinessRecord();
      setRecord(next);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הרענון נכשל. המידע הקיים נשמר.');
    } finally {
      setSyncing(false);
    }
  }

  const note = record ? statusLabel(record, syncing) : '';

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {note ? <p className="me-auto text-sm text-muted-foreground">{note}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={ROUTES.workspaceBusinessTry}>בדיקת אתר</Link>
          </Button>
          <Button type="button" onClick={() => void refresh()} disabled={syncing}>
            רענון
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {record ? <BusinessSections record={record} /> : <p className="text-sm">טוען…</p>}
    </main>
  );
}
