'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckIcon } from 'lucide-react';
import type { ConnectionCatalogItem, IntegrationId } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { api } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { IntegrationIcon } from './integration-icons';

const FEATURED_IDS: IntegrationId[] = [
  'whatsapp',
  'google_sheets',
  'google_analytics',
  'google_workspace',
  'facebook',
  'instagram',
  'google_business',
  'google_ads',
  'microsoft_365',
  'slack',
  'zoom',
];

const FEATURED_LABELS: Record<IntegrationId, string> = {
  whatsapp: 'WhatsApp',
  google_sheets: 'Google Sheets',
  google_analytics: 'Google Analytics',
  google_workspace: 'Google Workspace',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google_business: 'Google Business Profile',
  google_ads: 'Google Ads',
  microsoft_365: 'Microsoft 365',
  slack: 'Slack',
  zoom: 'Zoom',
  meta: 'Meta',
};

function isConnected(item: ConnectionCatalogItem | undefined): boolean {
  if (!item) return false;
  const list = item.connections?.length
    ? item.connections
    : item.connection
      ? [item.connection]
      : [];
  return list.some((c) => c.status === 'connected' || c.status === 'inactive');
}

/** Always-light logo well so brand marks stay readable in light and dark. */
function LogoFrame({
  children,
  muted,
  connected,
}: {
  children: ReactNode;
  muted?: boolean;
  connected?: boolean;
}) {
  return (
    <div
      className={`relative flex size-14 items-center justify-center rounded-md border border-border bg-[#F8FAFC] p-2.5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-muted-foreground/50 sm:size-16 sm:p-3 ${
        muted ? 'opacity-45' : ''
      }`}
    >
      <div className="flex size-full items-center justify-center [&>svg]:size-full [&>svg]:shrink-0">
        {children}
      </div>
      {connected ? (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#F8FAFC] bg-[#C6D8D3] text-[#0B111E]">
          <CheckIcon className="size-3" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

export function FeaturedIntegrations({
  catalog: catalogProp,
  titleId = 'integrations-featured-title',
}: {
  /** When omitted, the section loads the connections catalog itself. */
  catalog?: ConnectionCatalogItem[];
  titleId?: string;
}) {
  const [fetched, setFetched] = useState<ConnectionCatalogItem[] | null>(
    catalogProp ? null : [],
  );

  useEffect(() => {
    if (catalogProp) return;
    let cancelled = false;
    void api
      .listConnectionsCatalog()
      .then((res) => {
        if (!cancelled) setFetched(res.catalog);
      })
      .catch(() => {
        if (!cancelled) setFetched([]);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogProp]);

  const catalog = catalogProp ?? fetched ?? [];

  const byId = useMemo(() => {
    const map = new Map<IntegrationId, ConnectionCatalogItem>();
    for (const item of catalog) map.set(item.integrationId, item);
    return map;
  }, [catalog]);

  const featuredIds = useMemo(() => {
    const available: IntegrationId[] = [];
    const soon: IntegrationId[] = [];
    for (const id of FEATURED_IDS) {
      const item = byId.get(id);
      if (item?.status === 'coming_soon') soon.push(id);
      else available.push(id);
    }
    return [...available, ...soon];
  }, [byId]);

  return (
    <section
      aria-labelledby={titleId}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <div className="flex flex-col gap-4">
        <h2
          id={titleId}
          className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          חברו את הכלים שהעסק כבר משתמש בהם
        </h2>
        <p className="max-w-md text-muted-foreground text-pretty">
          חיבור מאובטח לחשבונות חיצוניים — Google, Meta ועוד — כדי לייבא
          נתונים, לשלוח הודעות ולהפעיל ערוצי תקשורת מול לקוחות.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link href={ROUTES.workspaceIntegrationsConnections}>
              לכל החיבורים
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.workspaceIntegrationsChannels}>לערוצים</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto grid w-fit grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-3.5 lg:mx-0 lg:ms-auto">
        {featuredIds.map((id) => {
          const item = byId.get(id);
          const soon = item?.status === 'coming_soon';
          const connected = isConnected(item);
          const label = item?.name ?? FEATURED_LABELS[id] ?? id;
          const accessibleName = connected ? `${label}, מחובר` : label;
          return (
            <Link
              key={id}
              href={`${ROUTES.workspaceIntegrationsConnections}/${id}`}
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={accessibleName}
              aria-label={accessibleName}
            >
              <LogoFrame muted={soon} connected={connected}>
                <IntegrationIcon id={id} className="size-full" />
              </LogoFrame>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
