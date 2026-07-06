'use client';

import { Check, Lock } from 'lucide-react';
import { Card, CardContent } from '@kodem/design-system/components/ui/card';
import {
  INCLUDED_MODULES,
  PREMIUM_MODULES,
} from '../../../lib/setup/constants';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function ModulesScreen({
  state,
  advance,
  isSubmitting,
  error,
}: SetupScreenProps) {
  const activated = state.setup.modules?.activated ?? [];

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="המודולים שלך"
        subtitle="אלה המודולים שמופעלים עבורך כבר עכשיו."
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">כלול</p>
          {INCLUDED_MODULES.map((mod) => (
            <Card key={mod.id} className="border shadow-sm">
              <CardContent className="flex items-start gap-3 pt-4">
                <Check className="mt-0.5 size-4 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{mod.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mod.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Premium</p>
          {PREMIUM_MODULES.map((mod) => (
            <Card
              key={mod.id}
              className="border border-dashed opacity-75 shadow-none"
            >
              <CardContent className="flex items-start gap-3 pt-4">
                <Lock className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <div>
                  <p className="font-medium">{mod.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mod.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8">
        <SetupPrimaryButton
          disabled={isSubmitting}
          onClick={() =>
            void advance('modules', { modules: { activated } })
          }
        >
          {isSubmitting ? 'שומר…' : 'המשך'}
        </SetupPrimaryButton>
      </div>
    </SetupShell>
  );
}
