'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import type { ChannelCatalogItem } from '@kodem/contracts';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { Button } from '@kodem/design-system/components/ui/button';
import { api, isApiError } from '../../lib/api';
import { can } from '../../lib/auth/permissions';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { ChannelIcon } from './integration-icons';

export function ChannelsCatalogView() {
  const { role } = useAuth();
  const canManage = can(role, 'connections:manage');
  const [catalog, setCatalog] = useState<ChannelCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listChannelsCatalog();
      setCatalog(res.catalog);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הערוצים נכשלה');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

        <ul className="divide-y rounded-lg border">
          {catalog.map((item) => {
            const connected = item.channel?.status === 'connected';
            const errored = item.channel?.status === 'error';
            const primary = item.channel?.bindings.find((b) => b.isPrimary);
            return (
              <li key={item.type}>
                <div className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background p-1.5">
                    <ChannelIcon type={item.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
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
                      <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                        via {primary.externalAccountName ?? primary.provider}
                      </p>
                    ) : null}
                  </div>
                  <ArrowLeftIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
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
