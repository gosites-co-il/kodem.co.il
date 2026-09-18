import { Suspense } from 'react';
import { ConnectionsCatalogView } from '../../../../../components/integrations/connections-catalog-view';

export default function IntegrationsConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<p className="text-sm text-muted-foreground">טוען…</p>}>
        <ConnectionsCatalogView />
      </Suspense>
      {children}
    </>
  );
}
