import { Suspense } from 'react';
import { ConnectionsCatalogView } from '../../../../../components/integrations/connections-catalog-view';

/** Settings route reuses the same Connections UI. */
export default function SettingsConnectionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">טוען…</p>}>
      <ConnectionsCatalogView />
    </Suspense>
  );
}
