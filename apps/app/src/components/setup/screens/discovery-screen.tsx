'use client';

import { Check, Loader2 } from 'lucide-react';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function DiscoveryScreen({
  state,
  advance,
  isSubmitting,
  error,
}: SetupScreenProps) {
  const findings = state.setup.discoveryFindings ?? [];

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="מה כבר גילינו"
        subtitle="Kodem כבר מבין את העסק שלך."
      />

      <ul className="space-y-2">
        {findings.map((finding) => (
          <li
            key={finding.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
          >
            {finding.status === 'completed' ? (
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
            )}
            {finding.label}
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8">
        <SetupPrimaryButton
          disabled={isSubmitting}
          onClick={() => void advance('discovery')}
        >
          {isSubmitting ? 'ממשיך…' : 'המשך'}
        </SetupPrimaryButton>
      </div>
    </SetupShell>
  );
}
