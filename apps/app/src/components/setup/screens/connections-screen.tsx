'use client';

import { useState } from 'react';
import type { IntegrationId } from '@kodem/contracts';
import { Card, CardContent } from '@kodem/design-system/components/ui/card';
import { Button } from '@kodem/design-system/components/ui/button';
import { INTEGRATIONS } from '../../../lib/setup/constants';
import {
  SetupHeadline,
  SetupNavButtons,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function ConnectionsScreen({
  state,
  advance,
  isSubmitting,
  error,
  goBack,
}: SetupScreenProps) {
  const [connected, setConnected] = useState<IntegrationId[]>(
    state.setup.connections?.connected ?? [],
  );
  const [skipped, setSkipped] = useState<IntegrationId[]>(
    state.setup.connections?.skipped ?? [],
  );

  function toggleConnect(id: IntegrationId) {
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSkipped((prev) => prev.filter((x) => x !== id));
  }

  function toggleSkip(id: IntegrationId) {
    setSkipped((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setConnected((prev) => prev.filter((x) => x !== id));
  }

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="חיבורים"
        subtitle="חברו כלים שכבר משתמשים בהם. אפשר לדלג על הכול."
      />

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const isConnected = connected.includes(integration.id);
          const isSkipped = skipped.includes(integration.id);

          return (
            <Card key={integration.id} className="border shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant={isConnected ? 'default' : 'outline'}
                    onClick={() => toggleConnect(integration.id)}
                  >
                    חבר
                  </Button>
                  <Button
                    size="sm"
                    variant={isSkipped ? 'secondary' : 'ghost'}
                    onClick={() => toggleSkip(integration.id)}
                  >
                    דלג
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <SetupNavButtons
        continueDisabled={isSubmitting}
        continueLabel={isSubmitting ? 'שומר…' : 'המשך'}
        onContinue={() =>
          void advance('connections', {
            connections: { connected, skipped },
          })
        }
        onBack={() => void goBack('connections')}
        backDisabled={isSubmitting}
        secondary={
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() =>
              void advance('connections', {
                connections: {
                  connected: [],
                  skipped: INTEGRATIONS.map((i) => i.id),
                },
              })
            }
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            דלג על הכול
          </button>
        }
      />
    </SetupShell>
  );
}
