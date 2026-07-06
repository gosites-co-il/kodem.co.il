'use client';

import { useState } from 'react';
import type { AiProviderId } from '@kodem/contracts';
import { Card, CardContent } from '@kodem/design-system/components/ui/card';
import { cn } from '@kodem/design-system/lib/utils';
import { AI_PROVIDERS } from '../../../lib/setup/constants';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupSecondaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function AiScreen({
  state,
  advance,
  isSubmitting,
  error,
}: SetupScreenProps) {
  const [provider, setProvider] = useState<AiProviderId>(
    state.setup.ai?.provider ?? 'kodem',
  );

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="הבינה המלאכותית"
        subtitle="Kodem AI מוגדר כברירת מחדל — מותאם לעסק שלך."
      />

      <div className="space-y-2">
        {AI_PROVIDERS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.premium}
            onClick={() => setProvider(item.id)}
            className={cn(
              'w-full text-start',
              item.premium && 'cursor-not-allowed opacity-50',
            )}
          >
            <Card
              className={cn(
                'border shadow-sm transition-colors',
                provider === item.id && 'border-primary ring-1 ring-primary',
              )}
            >
              <CardContent className="pt-4">
                <p className="font-medium">
                  {item.name}
                  {item.premium ? (
                    <span className="ms-2 text-xs text-muted-foreground">
                      Premium
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-8 space-y-2">
        <SetupPrimaryButton
          disabled={isSubmitting}
          onClick={() => void advance('ai', { ai: { provider } })}
        >
          {isSubmitting ? 'שומר…' : 'המשך'}
        </SetupPrimaryButton>
        <div className="text-center">
          <SetupSecondaryButton
            disabled={isSubmitting}
            onClick={() =>
              void advance('ai', { ai: { provider: 'kodem', skipped: true } })
            }
          >
            דלג — השתמש ב-Kodem AI
          </SetupSecondaryButton>
        </div>
      </div>
    </SetupShell>
  );
}
