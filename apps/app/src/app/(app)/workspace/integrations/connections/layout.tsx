'use client';

import { ConnectionsCatalogView } from '../../../../../components/integrations/connections-catalog-view';

/** Host catalog in the layout so [[...integrationId]] navigations do not remount it. */
export default function IntegrationsConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConnectionsCatalogView />
      {children}
    </>
  );
}
