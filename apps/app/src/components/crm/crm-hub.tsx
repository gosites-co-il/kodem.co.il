'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError } from '../../lib/api';
import type { CrmOverviewResponse } from '../../lib/crm';
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_PRESET_LABELS,
  CRM_TASK_STATUS_LABELS,
} from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmEmpty,
  CrmError,
  CrmListRow,
  CrmLoading,
  CrmStatusBadge,
} from './crm-ui';

export function CrmHub() {
  const [data, setData] = useState<CrmOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const overview = await api.getCrmOverview();
      setData(overview);
      setError(null);
    } catch (err) {
      setError(
        isApiError(err) ? err.message : 'לא ניתן לטעון את סקירת ה-CRM',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <CrmShell
      title="CRM"
      description="לוחות עבודה, לידים, אנשי קשר ומשימות מעקב"
      actions={
        <>
          <Button asChild>
            <Link href="/crm/boards">לוח חדש</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/crm/leads">ליד חדש</Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <CrmLoading label="טוען סקירה..." />
      ) : error ? (
        <CrmError message={error} onRetry={() => void load()} />
      ) : data ? (
        <>
          <div className="flex flex-wrap gap-2">
            <ShortcutChip
              href="/crm/boards"
              label="לוחות"
              count={data.counts.boards}
            />
            <ShortcutChip
              href="/crm/leads"
              label="לידים"
              count={data.counts.leads}
            />
            <ShortcutChip
              href="/crm/contacts"
              label="אנשי קשר"
              count={data.counts.contacts}
            />
            <ShortcutChip
              href="/crm/tasks"
              label="משימות פתוחות"
              count={data.counts.openTasks}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">לוחות</CardTitle>
                <CardDescription>לוחות העבודה שלכם</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data.recentBoards ?? []).length === 0 ? (
                  <CrmEmpty
                    title="עדיין אין לוחות"
                    description="התחילו עם לוח מכירות או תמיכה."
                    action={
                      <Button size="sm" asChild>
                        <Link href="/crm/boards">צור לוח</Link>
                      </Button>
                    }
                  />
                ) : (
                  data.recentBoards.map((board) => (
                    <CrmListRow
                      key={board.id}
                      href={`/crm/boards/${board.id}`}
                      title={board.name}
                      meta={
                        <CrmStatusBadge tone="secondary">
                          {CRM_PRESET_LABELS[board.preset]}
                        </CrmStatusBadge>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">לידים אחרונים</CardTitle>
                <CardDescription>מה שנוסף לאחרונה</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentLeads.length === 0 ? (
                  <CrmEmpty
                    title="עדיין אין לידים"
                    description="קלטו ליד ראשון והתחילו מעקב."
                    action={
                      <Button size="sm" asChild>
                        <Link href="/crm/leads">צור ליד</Link>
                      </Button>
                    }
                  />
                ) : (
                  data.recentLeads.map((lead) => (
                    <CrmListRow
                      key={lead.id}
                      href={`/crm/leads/${lead.id}`}
                      title={lead.name}
                      meta={
                        <CrmStatusBadge>
                          {CRM_LEAD_STATUS_LABELS[lead.status]}
                        </CrmStatusBadge>
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">משימות אחרונות</CardTitle>
                <CardDescription>מעקב אחרי פעילות</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentTasks.length === 0 ? (
                  <CrmEmpty
                    title="אין משימות עדיין"
                    description="הוסיפו משימת מעקב לליד או לאיש קשר."
                    action={
                      <Button size="sm" variant="secondary" asChild>
                        <Link href="/crm/tasks">למשימות</Link>
                      </Button>
                    }
                  />
                ) : (
                  data.recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <p className="truncate font-medium">{task.title}</p>
                      <CrmStatusBadge>
                        {CRM_TASK_STATUS_LABELS[task.status]}
                      </CrmStatusBadge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </CrmShell>
  );
}

function ShortcutChip({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span>{label}</span>
      <span className="tabular-nums text-muted-foreground">{count}</span>
    </Link>
  );
}
